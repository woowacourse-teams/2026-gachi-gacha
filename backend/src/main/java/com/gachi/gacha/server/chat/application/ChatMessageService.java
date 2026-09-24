package com.gachi.gacha.server.chat.application;

import com.gachi.gacha.server.chat.application.dto.ChatMessageInfo;
import com.gachi.gacha.server.chat.application.dto.ChatMessagePageInfo;
import com.gachi.gacha.server.chat.application.dto.ChatMessageSendCommand;
import com.gachi.gacha.server.chat.domain.ChatMessage;
import com.gachi.gacha.server.chat.domain.ChatMessageMongoRepository;
import com.gachi.gacha.server.chat.domain.ChatRoom;
import com.gachi.gacha.server.chat.domain.ChatRoomJpaRepository;
import com.gachi.gacha.server.chat.domain.ChatRoomMember;
import com.gachi.gacha.server.chat.domain.ChatRoomMemberJpaRepository;
import com.gachi.gacha.server.chat.domain.exception.InvalidReadSequenceException;
import com.gachi.gacha.server.common.exception.ErrorCode;
import com.gachi.gacha.server.common.exception.InvalidPageRequestException;
import java.time.LocalDateTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ChatMessageService {

    private static final int MAX_PAGE_SIZE = 100;

    private final ChatRoomJpaRepository chatRoomJpaRepository;
    private final ChatRoomMemberJpaRepository chatRoomMemberJpaRepository;
    private final ChatMessageMongoRepository chatMessageMongoRepository;

    public ChatMessagePageInfo getMessages(
            final Long memberId,
            final Long roomId,
            final Long lastSequence,
            final int pageSize
    ) {
        validatePageRequest(lastSequence, pageSize);
        chatRoomJpaRepository.getById(roomId);
        chatRoomMemberJpaRepository.getByRoomIdAndMemberId(roomId, memberId);

        Pageable pageable = PageRequest.of(0, pageSize + 1);
        List<ChatMessage> messages = findMessages(roomId, lastSequence, pageable);
        return ChatMessagePageInfo.of(messages, pageSize);
    }

    private List<ChatMessage> findMessages(
            final Long roomId,
            final Long lastSequence,
            final Pageable pageable
    ) {
        if (lastSequence == null) {
            return chatMessageMongoRepository.findByRoomIdOrderBySequenceDesc(roomId, pageable);
        }
        return chatMessageMongoRepository.findByRoomIdAndSequenceLessThanOrderBySequenceDesc(
                roomId,
                lastSequence,
                pageable
        );
    }

    private void validatePageRequest(final Long lastSequence, final int pageSize) {
        if (pageSize <= 0 || pageSize > MAX_PAGE_SIZE) {
            throw new InvalidPageRequestException(ErrorCode.INVALID_PAGE_REQUEST);
        }
        if (lastSequence != null && lastSequence <= 0) {
            throw new InvalidPageRequestException(ErrorCode.INVALID_PAGE_REQUEST);
        }
    }

    @Transactional
    public void checkReadMessage(
            final Long memberId,
            final Long roomId,
            final Long lastReadSequence
    ) {
        ChatRoom chatRoom = chatRoomJpaRepository.getById(roomId);

        ChatRoomMember chatRoomMember = chatRoomMemberJpaRepository.getByRoomIdAndMemberId(roomId, memberId);
        validateReadSequence(chatRoom, lastReadSequence);
        chatRoomMember.read(lastReadSequence);
    }

    private void validateReadSequence(
            final ChatRoom chatRoom,
            final Long lastReadSequence
    ) {
        if (lastReadSequence == null || lastReadSequence < 0 || lastReadSequence > chatRoom.getLastMessageSequence()) {
            throw new InvalidReadSequenceException(ErrorCode.INVALID_READ_SEQUENCE);
        }
    }

    @Transactional
    public ChatMessageInfo sendMessage(
            final Long senderId,
            final Long roomId,
            final ChatMessageSendCommand command
    ) {
        List<ChatMessage.MessageFile> files = command.toMessageFiles();
        ChatMessage.validate(command.type(), command.content(), files);

        ChatRoom chatRoom = chatRoomJpaRepository.getByIdForUpdate(roomId);
        ChatRoomMember sender = chatRoomMemberJpaRepository.getByRoomIdAndMemberId(roomId, senderId);

        String preview = ChatMessage.preview(command.type(), command.content());
        long sequence = chatRoom.appendMessage(preview, LocalDateTime.now());

        ChatMessage savedMessage = saveMessage(roomId, senderId, sequence, command, files);
        registerRollbackCompensation(savedMessage);

        sender.read(sequence);

        return ChatMessageInfo.from(savedMessage);
    }

    /**
     * 방 행 락(FOR UPDATE)을 쥔 상태이므로, 이 sequence로 이미 존재하는 문서는
     * 커밋되지 못한 고아 문서다. 그 번호를 커밋한 트랜잭션이 있었다면
     * chat_room.last_message_sequence가 이미 앞서 있어 이 번호를 발급받을 수 없기 때문이다.
     * 락 방식을 바꾸면(예: TTL이 있는 분산 락) 이 전제가 깨지므로 함께 검토해야 한다.
     */
    private ChatMessage saveMessage(
            final Long roomId,
            final Long senderId,
            final long sequence,
            final ChatMessageSendCommand command,
            final List<ChatMessage.MessageFile> files
    ) {
        try {
            return chatMessageMongoRepository.save(newMessage(roomId, senderId, sequence, command, files));
        } catch (DuplicateKeyException e) {
            log.warn("고아 채팅 메시지 정리 후 재시도. roomId={}, sequence={}", roomId, sequence);
            chatMessageMongoRepository.deleteByRoomIdAndSequence(roomId, sequence);
            return chatMessageMongoRepository.save(newMessage(roomId, senderId, sequence, command, files));
        }
    }

    private ChatMessage newMessage(
            final Long roomId,
            final Long senderId,
            final long sequence,
            final ChatMessageSendCommand command,
            final List<ChatMessage.MessageFile> files
    ) {
        return ChatMessage.create(roomId, senderId, sequence, command.type(), command.content(), files);
    }

    /**
     * Mongo 저장은 JPA 트랜잭션에 묶이지 않는다.
     * Postgres가 롤백되면 sequence는 되돌아가지만 Mongo 문서는 남아,
     * 이후 같은 sequence로 저장을 시도하는 모든 요청이 유니크 인덱스에 걸려
     * 채팅방이 영구히 메시지를 보낼 수 없는 상태가 된다.
     * 이를 막기 위해 롤백 시 저장했던 문서를 보상 삭제한다.
     */
    private void registerRollbackCompensation(final ChatMessage savedMessage) {
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            return;
        }
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCompletion(final int status) {
                if (status != STATUS_ROLLED_BACK) {
                    return;
                }
                deleteCompensated(savedMessage);
            }
        });
    }

    private void deleteCompensated(final ChatMessage savedMessage) {
        try {
            chatMessageMongoRepository.deleteById(savedMessage.getId());
        } catch (Exception e) {
            log.error(
                    "채팅 메시지 보상 삭제 실패. 수동 삭제 필요. roomId={}, sequence={}, messageId={}",
                    savedMessage.getRoomId(),
                    savedMessage.getSequence(),
                    savedMessage.getId(),
                    e
            );
        }
    }
}

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
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
    public void readMessage(
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

        ChatMessage savedMessage = chatMessageMongoRepository.save(
                ChatMessage.create(
                        roomId,
                        senderId,
                        sequence,
                        command.type(),
                        command.content(),
                        files
                )
        );

        sender.read(sequence);

        return ChatMessageInfo.from(savedMessage);
    }
}

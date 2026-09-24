package com.gachi.gacha.server.chat.domain;

import com.gachi.gacha.server.chat.domain.exception.ChatRoomAccessDeniedException;
import com.gachi.gacha.server.common.exception.ErrorCode;
import com.gachi.gacha.server.member.domain.Member;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface ChatRoomMemberJpaRepository extends JpaRepository<ChatRoomMember, Long> {

    @Query("""
            SELECT chatRoomMember
            FROM ChatRoomMember chatRoomMember
            JOIN FETCH chatRoomMember.chatRoom chatRoom
            WHERE chatRoomMember.member.id = :memberId
            ORDER BY COALESCE(chatRoom.lastMessageAt, chatRoom.createdAt) DESC,
                     chatRoom.id DESC
            """)
    List<ChatRoomMember> findMyChatRooms(Long memberId);

    @Query("""
            SELECT chatRoomMember
            FROM ChatRoomMember chatRoomMember
            JOIN FETCH chatRoomMember.chatRoom chatRoom
            JOIN FETCH chatRoomMember.member member
            WHERE chatRoom.id IN :roomIds
              AND member.id <> :memberId
            """)
    List<ChatRoomMember> findOtherMembers(List<Long> roomIds, Long memberId);

    @Query("""
            SELECT chatRoomMember
            FROM ChatRoomMember chatRoomMember
            WHERE chatRoomMember.chatRoom.id = :roomId
              AND chatRoomMember.member.id = :memberId
            """)
    Optional<ChatRoomMember> findByRoomIdAndMemberId(Long roomId, Long memberId);

    default ChatRoomMember getByRoomIdAndMemberId(final Long roomId, final Long memberId) {
        return findByRoomIdAndMemberId(roomId, memberId)
                .orElseThrow(() -> new ChatRoomAccessDeniedException(ErrorCode.CHAT_ROOM_ACCESS_DENIED));
    }

    @Query("""
            SELECT chatRoomMember.member
            FROM ChatRoomMember chatRoomMember
            WHERE chatRoomMember.chatRoom.id = :roomId
              AND chatRoomMember.member.id <> :memberId
            """)
    Optional<Member> findOtherMember(Long roomId, Long memberId);

    @Query("""
            SELECT COALESCE(
                SUM(
                    CASE
                        WHEN chatRoom.lastMessageSequence
                             > chatRoomMember.lastReadMessageSequence
                        THEN chatRoom.lastMessageSequence
                             - chatRoomMember.lastReadMessageSequence
                        ELSE 0
                    END
                ),
                0
            )
            FROM ChatRoomMember chatRoomMember
            JOIN chatRoomMember.chatRoom chatRoom
            WHERE chatRoomMember.member.id = :memberId
            """)
    long countUnreadMessage(Long memberId);
}

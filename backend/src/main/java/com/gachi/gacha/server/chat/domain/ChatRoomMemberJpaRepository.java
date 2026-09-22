package com.gachi.gacha.server.chat.domain;

import java.util.List;
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
}

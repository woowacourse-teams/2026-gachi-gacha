package com.gachi.gacha.server.chat.domain;

import com.gachi.gacha.server.common.domain.BaseTimeEntity;
import com.gachi.gacha.server.member.domain.Member;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "chat_room_member")
@Getter
@AllArgsConstructor
@NoArgsConstructor
public class ChatRoomMember extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chat_room_id", nullable = false)
    private ChatRoom chatRoom;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @Column(nullable = false)
    private Long lastReadMessageSequence;

    @Column(nullable = false)
    private LocalDateTime joinedAt;

    public static ChatRoomMember join(final ChatRoom chatRoom, final Member member) {
        return new ChatRoomMember(
                null,
                chatRoom,
                member,
                0L,
                LocalDateTime.now());
    }
}

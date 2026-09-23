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
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "chat_room_member")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
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

    private ChatRoomMember(final ChatRoom chatRoom, final Member member) {
        this.chatRoom = chatRoom;
        this.member = member;
        this.lastReadMessageSequence = 0L;
        this.joinedAt = LocalDateTime.now();
    }

    public static ChatRoomMember join(final ChatRoom chatRoom, final Member member) {
        return new ChatRoomMember(chatRoom, member);
    }

    public void read(final Long sequence) {
        if (sequence > lastReadMessageSequence) {
            lastReadMessageSequence = sequence;
        }
    }
}

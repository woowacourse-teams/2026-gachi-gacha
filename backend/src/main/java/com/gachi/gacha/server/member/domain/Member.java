package com.gachi.gacha.server.member.domain;

import static com.gachi.gacha.server.common.util.BaseUtils.valueOrCurrent;

import com.gachi.gacha.server.common.domain.BaseTimeEntity;
import com.gachi.gacha.server.member.domain.auth.vo.OauthId;
import jakarta.persistence.Column;
import jakarta.persistence.Embedded;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

@Getter
@Entity
@Builder
@AllArgsConstructor
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@SQLDelete(sql = "UPDATE member SET is_deleted = true, deleted_at = NOW() WHERE id = ?")
@SQLRestriction("is_deleted = false")
public class Member extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Embedded
    private OauthId oauthId;

    private String oauthUsername;
    private String nickname;
    private String profileImageUrl;
    private String desireTradeLocation;

    @Builder.Default
    @Column(nullable = false)
    private boolean isDeleted = false;

    private LocalDateTime deletedAt;

    public void patch(final String nickname, final String profileImageUrl, final String desireTradeLocation) {
        this.nickname = valueOrCurrent(nickname,  this.nickname);
        this.profileImageUrl = valueOrCurrent(profileImageUrl, this.profileImageUrl);
        this.desireTradeLocation = valueOrCurrent(desireTradeLocation, this.desireTradeLocation);
    }
}

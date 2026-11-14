package com.gachi.gacha.server.trade.domain;

import static org.assertj.core.api.Assertions.assertThat;

import com.gachi.gacha.server.chat.domain.ChatRoom;
import com.gachi.gacha.server.chat.domain.ChatRoomJpaRepository;
import com.gachi.gacha.server.member.domain.Member;
import com.gachi.gacha.server.member.domain.MemberJpaRepository;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@Transactional
class TradeJpaRepositoryTest {

    @Autowired
    private TradeJpaRepository tradeJpaRepository;

    @Autowired
    private MemberJpaRepository memberJpaRepository;

    @Autowired
    private ChatRoomJpaRepository chatRoomJpaRepository;

    @Autowired
    private EntityManager entityManager;

    @Test
    @DisplayName("채팅방이 있는 게시글도 삭제할 수 있고, 행은 남긴 채 조회에서만 제외한다")
    void softDeletesTradeReferencedByChatRoom() {
        // given
        Member owner = memberJpaRepository.save(Member.builder().nickname("owner").build());
        Member requester = memberJpaRepository.save(Member.builder().nickname("requester").build());
        Trade trade = tradeJpaRepository.save(Trade.builder().member(owner).title("가챠 교환").build());
        chatRoomJpaRepository.save(ChatRoom.create(trade.getId(), requester.getId()));
        entityManager.flush();

        // when
        tradeJpaRepository.delete(trade);
        entityManager.flush();
        entityManager.clear();

        // then
        assertThat(tradeJpaRepository.findById(trade.getId())).isEmpty();
        Object isDeleted = entityManager
                .createNativeQuery("SELECT is_deleted FROM trade WHERE id = :id")
                .setParameter("id", trade.getId())
                .getSingleResult();
        assertThat(isDeleted).isEqualTo(true);
    }
}

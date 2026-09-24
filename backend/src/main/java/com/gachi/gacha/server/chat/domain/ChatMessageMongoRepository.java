package com.gachi.gacha.server.chat.domain;

import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ChatMessageMongoRepository extends MongoRepository<ChatMessage, String> {

    List<ChatMessage> findByRoomIdOrderBySequenceDesc(Long roomId, Pageable pageable);

    List<ChatMessage> findByRoomIdAndSequenceLessThanOrderBySequenceDesc(
            Long roomId,
            Long sequence,
            Pageable pageable
    );

    void deleteByRoomIdAndSequence(Long roomId, Long sequence);
}

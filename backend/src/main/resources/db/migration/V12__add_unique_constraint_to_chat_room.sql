ALTER TABLE chat_room
    ADD COLUMN requester_id BIGINT;

UPDATE chat_room
SET requester_id = chat_room_member.member_id
FROM chat_room_member
         JOIN trade ON trade.id = (SELECT trade_id FROM chat_room WHERE id = chat_room_member.chat_room_id)
WHERE chat_room_member.chat_room_id = chat_room.id
  AND chat_room_member.member_id <> trade.member_id;

ALTER TABLE chat_room
    ALTER COLUMN requester_id SET NOT NULL;

ALTER TABLE chat_room
    ADD CONSTRAINT fk_chat_room_requester
        FOREIGN KEY (requester_id) REFERENCES member (id);

ALTER TABLE chat_room
    ADD CONSTRAINT uk_chat_room_trade_requester
        UNIQUE (trade_id, requester_id);

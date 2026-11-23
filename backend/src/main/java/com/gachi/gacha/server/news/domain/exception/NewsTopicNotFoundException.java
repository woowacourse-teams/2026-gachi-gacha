package com.gachi.gacha.server.news.domain.exception;

import com.gachi.gacha.server.common.exception.EntityNotFoundException;
import com.gachi.gacha.server.common.exception.ErrorCode;

/**
 * 설정에 없는 주제로 요청했다.
 */
public class NewsTopicNotFoundException extends EntityNotFoundException {

    public NewsTopicNotFoundException() {
        super(ErrorCode.NEWS_TOPIC_NOT_FOUND);
    }
}

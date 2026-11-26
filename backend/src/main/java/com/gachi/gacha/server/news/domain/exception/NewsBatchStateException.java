package com.gachi.gacha.server.news.domain.exception;

import com.gachi.gacha.server.common.exception.BusinessException;
import com.gachi.gacha.server.common.exception.ErrorCode;
import com.gachi.gacha.server.news.domain.NewsBatchStatus;

/**
 * 회차의 현재 상태에서 할 수 없는 전이를 요청했다. 버튼을 두 번 눌렀거나, 이미 승인·만료된 메시지의 버튼을 누른 경우다.
 */
public class NewsBatchStateException extends BusinessException {

    public NewsBatchStateException(final NewsBatchStatus current, final String action) {
        super(ErrorCode.NEWS_BATCH_STATE_CONFLICT, "회차 상태 " + current + " 에서는 " + action + " 할 수 없다");
    }
}

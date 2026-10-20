package com.gachi.gacha.server.trade.domain.exception;

import com.gachi.gacha.server.common.exception.ErrorCode;
import com.gachi.gacha.server.common.exception.ExternalApiException;

public class TradeIndexingException extends ExternalApiException {

  public TradeIndexingException(final ErrorCode errorCode, final String detailMessage) {
    super(errorCode, detailMessage);
  }
}

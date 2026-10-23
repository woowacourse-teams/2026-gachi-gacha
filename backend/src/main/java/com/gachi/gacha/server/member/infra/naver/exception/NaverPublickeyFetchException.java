package com.gachi.gacha.server.member.infra.naver.exception;

import com.gachi.gacha.server.common.exception.ErrorCode;
import com.gachi.gacha.server.common.exception.ExternalApiException;

public class NaverPublickeyFetchException extends ExternalApiException {

  public NaverPublickeyFetchException(ErrorCode errorCode) {
    super(errorCode);
  }
}

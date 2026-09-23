package com.gachi.gacha.server.member.infra.kakao.exception;

import com.gachi.gacha.server.common.exception.ErrorCode;
import com.gachi.gacha.server.common.exception.UnAuthorizationException;

public class UnAuthorizationKakaoTokenException extends UnAuthorizationException {
  public UnAuthorizationKakaoTokenException(ErrorCode errorCode) {
    super(errorCode);
  }
}

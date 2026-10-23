package com.gachi.gacha.server.member.infra.apple.exception;

import com.gachi.gacha.server.common.exception.ErrorCode;
import com.gachi.gacha.server.member.domain.exception.InvalidOauthStateException;

public class InvalidAppleOauthStateException extends InvalidOauthStateException {

  public InvalidAppleOauthStateException(ErrorCode errorCode) {
    super(errorCode);
  }
}

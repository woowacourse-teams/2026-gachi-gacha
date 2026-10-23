package com.gachi.gacha.server.member.domain.auth.authcode;

import com.gachi.gacha.server.common.exception.ErrorCode;
import com.gachi.gacha.server.member.domain.auth.vo.OauthProviderType;
import com.gachi.gacha.server.member.domain.exception.UnSupportedProviderTypeException;

public interface AuthCodeRequestUrlProvider {
    OauthProviderType supportProvider();
    String provide(final String nonce);

    default String provideForWithdraw(final String nonce) {
        throw new UnSupportedProviderTypeException(ErrorCode.UNSUPPORTED_TYPE_ERROR);
    }
}

package com.gachi.gacha.server.member.presentation.converter;

import com.gachi.gacha.server.common.exception.ErrorCode;
import com.gachi.gacha.server.member.domain.auth.vo.OauthProviderType;
import com.gachi.gacha.server.member.domain.exception.UnSupportedServerTypeException;
import org.springframework.core.convert.converter.Converter;

public class OauthProviderTypeConverter implements Converter<String, OauthProviderType> {

    @Override
    public OauthProviderType convert(final String source) {
        if (source.isBlank()) {
            throw new UnSupportedServerTypeException(ErrorCode.UNSUPPORTED_TYPE_ERROR);
        }
        return OauthProviderType.fromName(source);
    }
}

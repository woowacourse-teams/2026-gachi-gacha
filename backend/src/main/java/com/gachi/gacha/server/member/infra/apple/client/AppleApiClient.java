package com.gachi.gacha.server.member.infra.apple.client;

import static org.springframework.http.MediaType.APPLICATION_FORM_URLENCODED_VALUE;

import com.gachi.gacha.server.member.infra.apple.dto.AppleToken;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.service.annotation.PostExchange;

public interface AppleApiClient {

    @PostExchange(url = "https://appleid.apple.com/auth/token", contentType = APPLICATION_FORM_URLENCODED_VALUE)
    AppleToken fetchToken(@RequestBody MultiValueMap<String, String> params);

    @PostExchange(url = "https://appleid.apple.com/auth/revoke", contentType = APPLICATION_FORM_URLENCODED_VALUE)
    void revoke(@RequestBody MultiValueMap<String, String> params);
}

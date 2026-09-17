package com.gachi.gacha.server.member.infra.naver.client;

import static org.springframework.http.HttpHeaders.AUTHORIZATION;
import static org.springframework.http.MediaType.APPLICATION_FORM_URLENCODED_VALUE;

import com.gachi.gacha.server.member.infra.naver.dto.NaverProfileResponse;
import com.gachi.gacha.server.member.infra.naver.dto.NaverToken;

import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.service.annotation.GetExchange;
import org.springframework.web.service.annotation.PostExchange;

public interface NaverApiClient {

    @PostExchange(url = "https://nid.naver.com/oauth2/token", contentType = APPLICATION_FORM_URLENCODED_VALUE)
    NaverToken fetchToken(@RequestParam("params") MultiValueMap<String, String> params);

    @GetExchange("https://openapi.naver.com/v1/nid/me")
    NaverProfileResponse fetchProfile(@RequestHeader(name = AUTHORIZATION) String bearerToken);
}

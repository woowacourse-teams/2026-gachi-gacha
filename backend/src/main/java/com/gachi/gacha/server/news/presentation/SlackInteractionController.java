package com.gachi.gacha.server.news.presentation;

import com.gachi.gacha.server.news.application.NewsInteractionService;
import com.gachi.gacha.server.news.application.dto.SlackInteraction;
import com.gachi.gacha.server.news.infra.SlackSignatureVerifier;
import io.swagger.v3.oas.annotations.Hidden;
import jakarta.servlet.http.HttpServletRequest;
import java.io.IOException;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.Instant;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBooleanProperty;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

/**
 * 슬랙 버튼 요청을 받는 엔드포인트. 회원 인증이 없고 요청 서명으로만 보호한다.
 * 서명은 파싱하기 전의 원본 본문으로 검증한다. 스프링이 폼 본문을 파라미터로 다시 조립한 값으로는 서명이 맞지 않을 수 있어서
 * {@code @RequestBody} 나 파라미터 바인딩을 쓰지 않고 요청 스트림을 직접 읽는다.
 */
@Slf4j
@Hidden
@RestController
@RequestMapping("/slack")
@RequiredArgsConstructor
@ConditionalOnBooleanProperty("news.enabled")
public class SlackInteractionController {

    private static final int MAX_BODY_BYTES = 1 << 20;
    private static final String PAYLOAD_FIELD = "payload";

    private final SlackSignatureVerifier signatureVerifier;
    private final NewsInteractionService interactionService;
    private final ObjectMapper objectMapper;
    private final Clock clock;

    @PostMapping("/interactions")
    public ResponseEntity<Void> interactions(
            final HttpServletRequest request,
            @RequestHeader(name = "X-Slack-Request-Timestamp", required = false) final String timestamp,
            @RequestHeader(name = "X-Slack-Signature", required = false) final String signature
    ) throws IOException {
        byte[] body = request.getInputStream().readNBytes(MAX_BODY_BYTES + 1);
        if (body.length > MAX_BODY_BYTES) {
            return ResponseEntity.badRequest().build();
        }
        if (!signatureVerifier.verify(timestamp, signature, body, Instant.now(clock))) {
            log.warn("슬랙 요청 서명 검증에 실패했다");
            return ResponseEntity.status(401).build();
        }
        Optional<JsonNode> payload = readPayload(new String(body, StandardCharsets.UTF_8));
        if (payload.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        SlackInteraction.from(payload.get()).ifPresent(interactionService::handle);
        return ResponseEntity.ok().build();
    }

    /**
     * 폼 본문 {@code payload=<URL 인코딩된 JSON>} 에서 JSON 을 꺼낸다.
     */
    private Optional<JsonNode> readPayload(final String body) {
        for (String pair : body.split("&")) {
            int separator = pair.indexOf('=');
            if (separator > 0 && PAYLOAD_FIELD.equals(pair.substring(0, separator))) {
                try {
                    return Optional.of(objectMapper.readTree(
                            URLDecoder.decode(pair.substring(separator + 1), StandardCharsets.UTF_8)));
                } catch (JacksonException | IllegalArgumentException e) {
                    return Optional.empty();
                }
            }
        }
        return Optional.empty();
    }
}

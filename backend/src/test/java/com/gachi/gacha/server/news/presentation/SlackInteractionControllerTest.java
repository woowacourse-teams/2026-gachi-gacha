package com.gachi.gacha.server.news.presentation;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.BDDMockito.then;
import static org.mockito.Mockito.after;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.timeout;

import com.gachi.gacha.server.news.application.NewsInteractionService;
import com.gachi.gacha.server.news.infra.SlackClient;
import io.restassured.RestAssured;
import io.restassured.response.ExtractableResponse;
import io.restassured.response.Response;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.HexFormat;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpStatus;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

/**
 * 슬랙 버튼 요청이 서명 검증을 거쳐 처리되는지 실제 서버로 확인한다. 슬랙은 호출하지 않고 SlackClient 를 대신한다.
 * 서명은 요청 원본 본문으로 계산하므로, 한국어와 특수문자가 퍼센트 인코딩된 본문도 그대로 통과해야 한다.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT, properties = {
        "news.enabled=true",
        "news.dry-run=false",
        "news.zone=Asia/Seoul",
        "news.xai.api-key=test-key",
        "news.slack.bot-token=xoxb-test",
        "news.slack.channel-id=C0NEWS",
        "news.slack.signing-secret=" + SlackInteractionControllerTest.SECRET,
        "news.slack.approvers=U_APPROVER:1",
        "news.schedule.monday-cron=0 0 0 1 1 *",
        "news.schedule.thursday-cron=0 0 0 1 1 *"
})
class SlackInteractionControllerTest {

    static final String SECRET = "test-signing-secret";
    private static final String PATH = "/api/v1/slack/interactions";

    @LocalServerPort
    private int port;

    @Autowired
    private NewsInteractionService interactionService;

    @MockitoBean
    private SlackClient slackClient;

    @BeforeEach
    void setUp() {
        RestAssured.port = port;
    }

    @Test
    @DisplayName("서명이 맞고 승인자가 누르면 200 으로 바로 응답하고, 그 사람에게만 보이는 안내를 보낸다")
    void acceptsSignedRequestFromApprover() {
        String body = body("U_APPROVER", "news_approve", "7");

        ExtractableResponse<Response> response = post(body, now(), sign(now(), body));

        assertThat(response.statusCode()).isEqualTo(HttpStatus.OK.value());
        then(slackClient).should(timeout(3000)).postEphemeral(
                org.mockito.ArgumentMatchers.eq("C0NEWS"), org.mockito.ArgumentMatchers.eq("U_APPROVER"),
                org.mockito.ArgumentMatchers.contains("news_approve"));
    }

    @Test
    @DisplayName("승인자가 아닌 사람이 누르면 200 으로 응답하고 승인 권한이 없다는 안내만 남긴다")
    void rejectsNonApprover() {
        String body = body("U_STRANGER", "news_approve", "7");

        ExtractableResponse<Response> response = post(body, now(), sign(now(), body));

        assertThat(response.statusCode()).isEqualTo(HttpStatus.OK.value());
        then(slackClient).should(timeout(3000)).postEphemeral("C0NEWS", "U_STRANGER", "승인 권한이 없습니다. 승인자로 등록된 사람만 누를 수 있습니다.");
    }

    @Test
    @DisplayName("서명이 맞지 않으면 401 이고 아무 처리도 하지 않는다")
    void rejectsInvalidSignature() {
        String body = body("U_APPROVER", "news_approve", "7");

        ExtractableResponse<Response> response = post(body, now(), "v0=" + "0".repeat(64));

        assertThat(response.statusCode()).isEqualTo(HttpStatus.UNAUTHORIZED.value());
        then(slackClient).should(after(500).never()).postEphemeral(anyString(), anyString(), any());
    }

    @Test
    @DisplayName("본문이 서명한 뒤에 바뀌었으면 401 이다")
    void rejectsTamperedBody() {
        String body = body("U_APPROVER", "news_approve", "7");
        String signature = sign(now(), body);

        ExtractableResponse<Response> response = post(body("U_APPROVER", "news_approve", "8"), now(), signature);

        assertThat(response.statusCode()).isEqualTo(HttpStatus.UNAUTHORIZED.value());
    }

    @Test
    @DisplayName("타임스탬프가 5분보다 오래됐으면 서명이 맞아도 401 이다")
    void rejectsStaleTimestamp() {
        String body = body("U_APPROVER", "news_approve", "7");
        String staleTimestamp = String.valueOf(Instant.now().getEpochSecond() - 6 * 60);

        ExtractableResponse<Response> response = post(body, staleTimestamp, sign(staleTimestamp, body));

        assertThat(response.statusCode()).isEqualTo(HttpStatus.UNAUTHORIZED.value());
        then(slackClient).should(after(500).never()).postEphemeral(anyString(), anyString(), any());
    }

    @Test
    @DisplayName("서명 헤더가 없으면 401 이다")
    void rejectsMissingHeaders() {
        ExtractableResponse<Response> response = RestAssured.given()
                .contentType("application/x-www-form-urlencoded")
                .body(body("U_APPROVER", "news_approve", "7"))
                .post(PATH).then().extract();

        assertThat(response.statusCode()).isEqualTo(HttpStatus.UNAUTHORIZED.value());
    }

    @Test
    @DisplayName("서명은 맞지만 payload 가 없거나 JSON 이 아니면 400 이고, 버튼 요청이 아니면 무시하고 200 이다")
    void handlesUnexpectedPayloads() {
        String noPayload = "foo=bar";
        String notJson = "payload=" + URLEncoder.encode("이건 JSON 이 아님", StandardCharsets.UTF_8);
        String otherType = "payload=" + URLEncoder.encode("{\"type\": \"view_submission\"}", StandardCharsets.UTF_8);

        assertThat(post(noPayload, now(), sign(now(), noPayload)).statusCode()).isEqualTo(HttpStatus.BAD_REQUEST.value());
        assertThat(post(notJson, now(), sign(now(), notJson)).statusCode()).isEqualTo(HttpStatus.BAD_REQUEST.value());
        assertThat(post(otherType, now(), sign(now(), otherType)).statusCode()).isEqualTo(HttpStatus.OK.value());
        then(slackClient).should(after(500).never()).postEphemeral(anyString(), anyString(), any());
    }

    private ExtractableResponse<Response> post(final String body, final String timestamp, final String signature) {
        return RestAssured.given().log().ifValidationFails()
                .contentType("application/x-www-form-urlencoded")
                .header("X-Slack-Request-Timestamp", timestamp)
                .header("X-Slack-Signature", signature)
                .body(body)
                .post(PATH)
                .then().log().ifValidationFails().extract();
    }

    /**
     * 슬랙이 보내는 형태: payload=URL 인코딩된 JSON. 이름에 한국어를 넣어 퍼센트 인코딩과 + 도 거친다.
     */
    private String body(final String userId, final String actionId, final String value) {
        String payload = """
                {"type": "block_actions", "user": {"id": "%s", "name": "지현 +테스터"}, "channel": {"id": "C0NEWS"},
                 "message": {"ts": "1731382200.000100"},
                 "actions": [{"action_id": "%s", "value": "%s", "type": "button"}]}
                """.formatted(userId, actionId, value);
        return "payload=" + URLEncoder.encode(payload, StandardCharsets.UTF_8);
    }

    private String now() {
        return String.valueOf(Instant.now().getEpochSecond());
    }

    private String sign(final String timestamp, final String body) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(SECRET.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return "v0=" + HexFormat.of().formatHex(mac.doFinal(("v0:" + timestamp + ":" + body).getBytes(StandardCharsets.UTF_8)));
        } catch (java.security.GeneralSecurityException e) {
            throw new IllegalStateException(e);
        }
    }
}

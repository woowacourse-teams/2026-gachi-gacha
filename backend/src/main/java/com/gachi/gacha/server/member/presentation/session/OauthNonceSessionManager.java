package com.gachi.gacha.server.member.presentation.session;

import jakarta.servlet.http.HttpSession;
import java.util.UUID;
import org.springframework.stereotype.Component;

@Component
public class OauthNonceSessionManager {

    private static final String NONCE_SESSION_KEY = "oauth_nonce";

    public String issue(HttpSession session) {
        String nonce = UUID.randomUUID().toString();
        session.setAttribute(NONCE_SESSION_KEY, nonce);
        return nonce;
    }

    public String consume(HttpSession session) {
        String nonce = (String) session.getAttribute(NONCE_SESSION_KEY);
        session.removeAttribute(NONCE_SESSION_KEY);
        return nonce;
    }
}

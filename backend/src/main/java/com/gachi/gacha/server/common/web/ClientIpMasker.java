package com.gachi.gacha.server.common.web;

import org.jspecify.annotations.Nullable;

/**
 * 클라이언트 IP 를 앞 두 조각만 남기고 자른다.
 *
 * <pre>
 * 118.44.23.1              -> 118.44
 * 2001:0db8:85a3:...       -> 2001:0db8
 * 0:0:0:0:0:0:0:1 (로컬)    -> 0:0
 * </pre>
 *
 * <p>전체 IP 는 저장하지 않는다. 개인정보를 필요한 만큼만 남기기 위함이며,
 * 그만큼 특정 사용자를 지목하는 용도로는 쓸 수 없다.
 */
public final class ClientIpMasker {

    private static final String UNKNOWN = "0.0";
    private static final int VISIBLE_SEGMENTS = 2;

    private ClientIpMasker() {
    }

    public static String mask(@Nullable final String ip) {
        if (ip == null || ip.isBlank()) {
            return UNKNOWN;
        }

        String delimiter = ip.contains(".") ? "." : ":";
        String[] segments = ip.split(java.util.regex.Pattern.quote(delimiter));
        if (segments.length < VISIBLE_SEGMENTS) {
            return ip;
        }

        return segments[0] + delimiter + segments[1];
    }
}

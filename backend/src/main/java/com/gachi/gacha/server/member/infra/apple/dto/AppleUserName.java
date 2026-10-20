package com.gachi.gacha.server.member.infra.apple.dto;

public record AppleUserName(
        String firstName,
        String lastName
) {
    public String toDisplayName() {
        String first = (firstName == null) ? "" : firstName.strip();
        String last = (lastName == null) ? "" : lastName.strip();

        if (first.isEmpty() && last.isEmpty()) {
            return null;
        }

        boolean korean = containsHangul(first) || containsHangul(last);
        return (korean ? last + first : first + " " + last).strip();
    }

    private static boolean containsHangul(final String s) {
        return s.codePoints().anyMatch(c -> Character.UnicodeScript.of(c) == Character.UnicodeScript.HANGUL);
    }
}

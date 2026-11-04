package com.gachi.gacha.server.trade.util;

import java.util.Comparator;
import java.util.List;
import java.util.regex.Pattern;
import java.util.stream.Stream;

public class TradeKeywordCleaner {

    // 거래글에서 자주 쓰이는 노이즈 단어 패턴 (불용어 목록)
    private static final List<String> NOISE_WORDS = Stream.of(
                    "팝니다", "삽니다", "구해요", "구합니다", "양도", "교환", "교환해요", "교환합니다", "원해요",
                    "급전", "에눌", "미개봉", "개봉", "전시",
                    "택배", "반택", "일택", "준등기", "우체국", "직거래", "가능", "거래완료", "완료",
                    "가격", "급처", "처분", "메지루시")
            .sorted(Comparator.comparingInt(String::length).reversed())
            .toList();

    // 특수문자, 이모티콘 등 제거용 정규식 (한글, 영문, 숫자의 조합만 남김)
    private static final Pattern SPECIAL_CHAR_PATTERN = Pattern.compile("[^가-힣a-zA-Z0-9\\s]");

    private TradeKeywordCleaner() {
    }

    public static String clean(final String text) {
        if (text == null) {
            return "";
        }

        // 1. 특수문자 및 이모티콘 제거
        String cleaned = SPECIAL_CHAR_PATTERN.matcher(text).replaceAll(" ");

        // 2. 불용어 제거
        for (String noise : NOISE_WORDS) {
            cleaned = cleaned.replace(noise, " ");
        }

        // 3. 다중 공백 정리
        return cleaned.replaceAll("\\s+", " ").trim();
    }
}

package com.gachi.gacha.server.news.infra;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.core.io.ClassPathResource;

/**
 * IP 별 프롬프트 파일(system.txt, user.txt)을 읽어 {{변수}} 를 채운다.
 *
 * <p>프롬프트 본문에 JSON 예시의 중괄호가 많아서 변수는 이중 중괄호로 쓴다. 파일에 있는 변수의 값이 없으면 잘못된 프롬프트가
 * 나가지 않도록 바로 실패한다. 앞뒤 공백은 지운다(스크립트의 read -d '' 와 같음).
 */
public class NewsPromptRenderer {

    private static final Pattern PLACEHOLDER = Pattern.compile("\\{\\{([A-Za-z]+)}}");

    private final Map<String, String> templates = new ConcurrentHashMap<>();

    public String system(final String promptDir, final Map<String, String> variables) {
        return render(template(promptDir + "/system.txt"), variables);
    }

    public String user(final String promptDir, final Map<String, String> variables) {
        return render(template(promptDir + "/user.txt"), variables);
    }

    private String template(final String path) {
        return templates.computeIfAbsent(path, this::read);
    }

    private String read(final String path) {
        ClassPathResource resource = new ClassPathResource(path);
        if (!resource.exists()) {
            throw new IllegalStateException("프롬프트 파일이 없다: classpath:" + path);
        }
        try (InputStream input = resource.getInputStream()) {
            return new String(input.readAllBytes(), StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new UncheckedIOException("프롬프트 파일을 읽지 못했다: " + path, e);
        }
    }

    private String render(final String template, final Map<String, String> variables) {
        Matcher matcher = PLACEHOLDER.matcher(template);
        StringBuilder rendered = new StringBuilder();
        while (matcher.find()) {
            String value = variables.get(matcher.group(1));
            if (value == null) {
                throw new IllegalArgumentException("프롬프트 변수 값이 없다: " + matcher.group(1));
            }
            matcher.appendReplacement(rendered, Matcher.quoteReplacement(value));
        }
        matcher.appendTail(rendered);
        return rendered.toString().strip();
    }
}

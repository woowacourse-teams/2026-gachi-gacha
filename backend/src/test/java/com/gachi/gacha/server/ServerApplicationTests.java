package com.gachi.gacha.server;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.web.client.RestTemplate;

@SpringBootTest
class ServerApplicationTests {

    @MockitoBean
    private RestTemplate restTemplate;

    @Test
    void contextLoads() {
    }

}

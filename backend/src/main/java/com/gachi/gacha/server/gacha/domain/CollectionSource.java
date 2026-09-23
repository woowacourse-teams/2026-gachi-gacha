package com.gachi.gacha.server.gacha.domain;

public enum CollectionSource {

    MANUAL,
    INSTAGRAM,
    BANDAI,
    IP4,
    A_MUZU;

    public boolean isCollectable() {
        return this == BANDAI || this == IP4 || this == A_MUZU;
    }
}

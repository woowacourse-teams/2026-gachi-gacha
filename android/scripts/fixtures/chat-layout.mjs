import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";

import ChatPage from "gachi-web-chat-page";
import { GlobalStyles } from "gachi-web-global-styles";

// These are real ChatPage, ChatRoomPanel and ChatImagePreview components. Only
// the route/data owner, authentication-dependent header/menu and analytics are
// substituted. No chat layout or scroll implementation is duplicated here.
const h = React.createElement;
const query = new URLSearchParams(location.search);
document.documentElement.style.setProperty(
  "--fixture-safe-area-bottom",
  `${Number(query.get("inset") || 0)}px`,
);

// Separately exercise visualViewport-only (pan/IME) and layout viewport resize.
// A resize without an override follows the real Chromium layout viewport.
let visualHeight = null;
const viewport = new EventTarget();
Object.defineProperties(viewport, {
  height: { get: () => visualHeight ?? innerHeight },
  width: { get: () => innerWidth },
  offsetTop: { get: () => 0 },
  offsetLeft: { get: () => 0 },
  scale: { get: () => 1 },
});
Object.defineProperty(window, "visualViewport", { value: viewport });
window.ReactNativeWebView = { postMessage() {} };

const messages = Array.from({ length: 50 }, (_, index) => ({
  id: `message-${index}`,
  sender: index % 2 ? "me" : "other",
  text: `QA message ${index}: 채팅 메시지 확인`,
  sentAt: "13:30",
  sentDate: "",
  images: [],
}));
const initialRoom = {
  conversationId: 1,
  partnerMemberId: 2,
  tradeId: 3,
  partnerName: "테스트 사용자",
  partnerProfileImageUrl: null,
  itemTitle: "레이아웃 확인용 교환 게시글",
  itemImageUrl: null,
  tradeStatus: "AVAILABLE",
  isTradeOwner: false,
  messages,
};

function Fixture() {
  const [room, setRoom] = useState(initialRoom);
  const [visible, setVisible] = useState(true);
  const presentation =
    query.get("presentation") === "drawer" ? "drawer" : "split";

  useEffect(() => {
    window.chatFixture = {
      resizeVisual(height) {
        visualHeight = height;
        viewport.dispatchEvent(new Event("resize"));
      },
      close() {
        history.pushState({}, "", "/trade");
        setVisible(false);
        dispatchEvent(new PopStateEvent("popstate"));
      },
      switchRoom() {
        setRoom((current) => ({
          ...initialRoom,
          conversationId: current.conversationId + 1,
        }));
      },
      appendMessage() {
        setRoom((current) => ({
          ...current,
          messages: [
            ...current.messages,
            {
              ...messages[0],
              id: `new-${current.messages.length}`,
              text: "새 메시지",
            },
          ],
        }));
      },
      attachPhoto() {
        const bytes = Uint8Array.from(
          atob(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=",
          ),
          (character) => character.charCodeAt(0),
        );
        const transfer = new DataTransfer();
        transfer.items.add(new File([bytes], "qa.png", { type: "image/png" }));
        const input = document.querySelector('input[type="file"]');
        input.files = transfer.files;
        input.dispatchEvent(new Event("change", { bubbles: true }));
      },
    };
  }, []);

  return h(
    React.Fragment,
    null,
    h(GlobalStyles),
    visible
      ? h(ChatPage, {
          conversations: [],
          selectedRoom: room,
          selectedConversationId: room.conversationId,
          presentation,
          socketStatus: "connected",
          onSendMessage: async () => {},
          onSendImages: async () => {},
        })
      : h("main", null, "다른 페이지"),
  );
}

createRoot(document.getElementById("root")).render(
  h(BrowserRouter, null, h(Fixture)),
);

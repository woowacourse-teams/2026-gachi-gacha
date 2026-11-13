import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, useLocation, useNavigate } from "react-router";

import { GlobalStyles } from "gachi-web-global-styles";
import TradeDetailPage from "gachi-web-trade-detail-page";
import ChatPage from "gachi-web-chat-page";

// All detail/comments/gallery/related-card/chat layouts come from the real web.
// Network, authentication and optional affiliate/header slots are substituted
// by the test bundler; no real users, messages, products or shops are loaded.
const h = React.createElement;
const image =
  "data:image/svg+xml;charset=UTF-8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1200"><rect width="1600" height="1200" fill="#f5dde4"/><circle cx="800" cy="600" r="300" fill="#d93b54"/></svg>',
  );
const baseDetail = {
  tradeId: 42,
  memberId: 11,
  title: "테스트 가챠 교환 물품",
  description: "테스트용 교환 물품 설명입니다. 실제 상품과 무관합니다.",
  desiredProduction: "제안 받아요",
  categories: ["테스트", "키링"],
  status: "AVAILABLE",
  purchaseStore: null,
  tradePlace: null,
  availableTime: null,
  imageUrls: Array.from({ length: 5 }, () => image),
  createdAt: "2026-11-13T00:00:00Z",
  updatedAt: "2026-11-13T00:00:00Z",
};
const viewer = {
  memberId: "21",
  nickname: "테스트 사용자",
  profileImageUrl: null,
};
const room = {
  conversationId: 1,
  partnerMemberId: 11,
  tradeId: 42,
  partnerName: "Very long test partner nickname repeated repeated",
  partnerProfileImageUrl: null,
  itemTitle: "Very long test trade title repeated repeated repeated repeated",
  itemImageUrl: image,
  tradeStatus: "AVAILABLE",
  isTradeOwner: true,
  messages: Array.from({ length: 30 }, (_, index) => ({
    id: String(index),
    sender: index % 2 ? "me" : "other",
    text: "테스트 메시지 " + index + " " + "LONG".repeat(8),
    sentAt: "오전 9:15",
    sentDate: "2026-11-13",
    images: [],
  })),
};

function Fixture() {
  const location = useLocation();
  const navigate = useNavigate();
  const [action, setAction] = useState("chat");
  const [long, setLong] = useState(false);
  const [status, setStatus] = useState("AVAILABLE");
  const enabled = (key) => long === true || long === key;
  const detail = {
    ...baseDetail,
    status,
    title: enabled("title")
      ? "길고 긴 테스트 제목 ".repeat(20)
      : baseDetail.title,
    description: enabled("description")
      ? "UNBROKEN_DESCRIPTION_".repeat(20)
      : baseDetail.description,
    desiredProduction: enabled("desired")
      ? "원하는 물품 ".repeat(30)
      : baseDetail.desiredProduction,
    categories: enabled("category")
      ? ["길게표시되는테스트카테고리".repeat(5), "테스트"]
      : baseDetail.categories,
  };
  const comments = Array.from({ length: 8 }, (_, index) => ({
    commentId: String(index),
    author: {
      ...viewer,
      nickname: enabled("nickname") ? "VeryLongNickname12345" : viewer.nickname,
    },
    content: enabled("comment")
      ? "UNBROKEN_COMMENT_".repeat(25)
      : "테스트 댓글입니다.",
    createdAt: baseDetail.createdAt,
  }));
  const relatedItems = Array.from({ length: 8 }, (_, index) => ({
    ...detail,
    tradeId: 100 + index,
    thumbnailUrl: image,
  }));
  useEffect(() => {
    window.tradeDetailFixture = { setAction, setLong, navigate };
  }, [navigate]);
  return h(
    React.Fragment,
    null,
    h(GlobalStyles),
    h(TradeDetailPage, {
      detail,
      action,
      relatedItems,
      comments,
      commentViewer: viewer,
      onSubmitComment: async () => {},
      onChangeStatus: async (nextStatus) => {
        window.lastFixtureStatusChange = nextStatus;
        setStatus(nextStatus);
      },
    }),
    location.pathname.startsWith("/chat/") &&
      h(ChatPage, {
        conversations: [],
        selectedRoom: room,
        presentation: "modal",
        socketStatus: "connected",
        onCloseModal: () => navigate("/trade/42"),
        onSendMessage: async () => {},
        onSendImages: async () => {},
        onChangeTradeStatus: async () => {},
      }),
  );
}

createRoot(document.getElementById("root")).render(
  h(BrowserRouter, null, h(Fixture)),
);

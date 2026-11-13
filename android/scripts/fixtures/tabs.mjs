import React, { useEffect } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, useLocation, useNavigate } from "react-router";
import { GlobalStyles } from "gachi-web-global-styles";
import {
  Header,
  MobileTabBar,
  MobileTab,
  ActionIcon,
} from "gachi-web-header-styles";
import { SiteFooter, shouldShowSiteFooter } from "gachi-web-footer";
import CreateTradeButton from "gachi-web-create-trade";
import {
  TradePage,
  TradeMain,
  ChatPage,
  MyPage,
} from "gachi-web-tab-page-styles";

// Real web tab/FAB/footer components and exact route-owned styled declarations;
// only auth/data/network-dependent page contents are test substitutes.
const h = React.createElement;
function Fixture() {
  const location = useLocation();
  const navigate = useNavigate();
  const trade = location.pathname === "/trade";
  const chat = location.pathname === "/chat";
  const pageComponent = trade ? TradePage : chat ? ChatPage : MyPage;
  useEffect(() => {
    window.tabsFixture = { navigate, path: location.pathname };
  }, [navigate, location.pathname]);
  const nav = h(
    MobileTabBar,
    { "aria-label": "하단 메뉴" },
    ...[
      ["/trade", "홈"],
      ["/map", "지도"],
      ["/chat", "채팅"],
      ["/mypage", "마이"],
    ].map(([to, label]) =>
      h(
        MobileTab,
        {
          to,
          key: to,
          "aria-current": location.pathname === to ? "page" : undefined,
        },
        h(
          ActionIcon,
          { viewBox: "0 0 24 24", "aria-hidden": true },
          h("circle", { cx: 12, cy: 12, r: 7 }),
        ),
        label,
      ),
    ),
  );
  const contents = h(
    trade ? TradeMain : "main",
    {
      "data-fixture-content": "",
      style: chat ? { flex: 1, minHeight: 0, overflow: "auto" } : undefined,
    },
    h("h1", null, trade ? "교환 게시글" : chat ? "채팅" : "마이페이지"),
    ...Array.from({ length: 25 }, (_, index) =>
      h(
        "article",
        {
          key: index,
          style: {
            height: 90,
            padding: 12,
            borderBottom: "1px solid #ddd",
            boxSizing: "border-box",
          },
        },
        `테스트 콘텐츠 ${index + 1}`,
      ),
    ),
    h(
      "button",
      { "data-fixture-last-action": "", type: "button" },
      trade ? "더보기" : "마지막 항목",
    ),
    h("footer", { id: "content-footer" }, "페이지 콘텐츠의 footer는 유지"),
  );
  return h(
    React.Fragment,
    null,
    h(GlobalStyles),
    h(
      pageComponent,
      { "data-fixture-page": "", "data-mobile-tabs": true },
      h(Header, { "data-mobile-tabs": true }, h("h2", null, "가치가챠")),
      nav,
      contents,
      trade && h(CreateTradeButton, { placement: "mobile" }),
    ),
    shouldShowSiteFooter(location.pathname) && h(SiteFooter),
  );
}
createRoot(document.getElementById("root")).render(
  h(BrowserRouter, null, h(Fixture)),
);

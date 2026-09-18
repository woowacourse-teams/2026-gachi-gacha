import { css } from '@emotion/react';

export const demoStyles = css`
  body {
    margin: 0;
  }
  .promo {
    --promo-red: #d53654;
    --promo-red-dark: #be2844;
    --promo-soft: #fbf0f3;
    --promo-ink: #202124;
    --promo-muted: #828284;
    --promo-border: #eae9eb;
    min-height: 100dvh;
    background: #fff;
    color: var(--promo-ink);
    font-family:
      'IBM Plex Sans KR',
      -apple-system,
      BlinkMacSystemFont,
      'Segoe UI',
      sans-serif;
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
  }
  .promo *,
  .promo *::before,
  .promo *::after {
    box-sizing: border-box;
  }
  .promo a {
    color: inherit;
    text-decoration: none;
  }
  .promo button,
  .promo input {
    font: inherit;
  }
  .promo button {
    cursor: pointer;
  }
  .promo button:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  .promo a:focus-visible,
  .promo button:focus-visible,
  .promo input:focus-visible {
    outline: 3px solid #d5365470;
    outline-offset: 4px;
  }
  .promo h1,
  .promo h2,
  .promo h3,
  .promo p {
    margin: 0;
  }
  .promo h1,
  .promo h2,
  .promo h3 {
    line-height: 1.45;
    letter-spacing: -0.035em;
  }
  .promo svg {
    flex-shrink: 0;
    vertical-align: middle;
  }
  .promo img {
    display: block;
    max-width: 100%;
  }
  .promo-container {
    width: min(1280px, calc(100% - 80px));
    margin: 0 auto;
  }
  .promo-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px 20px;
    border: 1px solid transparent;
    border-radius: 24px;
    background: var(--promo-red);
    color: white !important;
    font-size: 13px;
    font-weight: 650;
    white-space: nowrap;
    transition: background 0.15s;
  }
  .promo-button:hover {
    background: var(--promo-red-dark);
  }
  .promo-button.is-outline {
    background: #fff;
    color: var(--promo-ink) !important;
    border-color: var(--promo-border);
  }
  .promo-button.is-outline:hover {
    background: #f8f7f7;
  }
  .promo-button.is-outline.is-selected {
    color: var(--promo-red) !important;
    border-color: var(--promo-red);
  }
  .promo-icon-button {
    display: inline-grid;
    place-items: center;
    width: 40px;
    height: 40px;
    border: 1px solid var(--promo-border);
    border-radius: 50%;
    color: var(--promo-ink);
    background: #fff;
  }
  .promo-icon-button:hover {
    background: #f7f7f7;
  }
  .promo-text-button {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 5px 0;
    border: 0;
    background: transparent;
    color: var(--promo-ink);
    font-size: 13px;
    font-weight: 550;
    white-space: nowrap;
  }
  .promo-text-button:hover {
    color: var(--promo-red);
  }
  .promo-muted {
    color: var(--promo-muted);
  }
  .promo-demo-banner {
    min-height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    background: var(--promo-soft);
    color: #9e4153;
    padding: 5px 12px;
    font-size: 11px;
  }
  .promo-demo-label {
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 0.08em;
    padding: 1px 5px;
    border: 1px solid #d5365440;
    border-radius: 4px;
  }
  .promo-header {
    position: sticky;
    top: 0;
    z-index: 30;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 28px;
    min-height: 86px;
    padding: 16px max(32px, calc((100vw - 1440px) / 2));
    background: #fffffff5;
    backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--promo-border);
  }
  .promo-brand {
    display: inline-flex;
    align-items: center;
    gap: 12px;
    color: #e43628 !important;
    font-size: 23px;
    font-weight: 800;
    letter-spacing: -0.035em;
    white-space: nowrap;
  }
  .promo-navigation {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
  }
  .promo-navigation a {
    display: block;
    padding: 10px 17px;
    border-radius: 24px;
    color: #727275;
    font-weight: 700;
    font-size: 15px;
    white-space: nowrap;
  }
  .promo-navigation a:hover {
    background: #faf5f6;
  }
  .promo-navigation a.is-active {
    background: var(--promo-red);
    color: #fff;
  }
  .promo-header-search {
    min-width: 0;
    flex: 1;
    max-width: 480px;
  }
  .promo-header-actions {
    display: flex;
    gap: 10px;
  }
  .promo-mobile-search {
    display: none;
  }
  .promo-skip-link {
    position: fixed;
    top: -100px;
    left: 12px;
    padding: 10px 18px;
    background: #fff;
    border: 2px solid var(--promo-red);
    z-index: 90;
    border-radius: 8px;
  }
  .promo-skip-link:focus {
    top: 12px;
  }
  .promo-hero {
    padding: 52px 24px 0;
    text-align: center;
    border-bottom: 1px solid var(--promo-border);
  }
  .promo-eyebrow {
    color: var(--promo-red);
    font-size: 11px;
    font-weight: 650;
    letter-spacing: 0.1em;
    margin-bottom: 10px !important;
  }
  .promo-hero h1 {
    font-size: 30px;
    font-weight: 750;
    margin-bottom: 26px;
  }
  .promo-search-box {
    position: relative;
    width: 100%;
  }
  .promo-search-box.is-large {
    max-width: 610px;
    margin: 0 auto;
  }
  .promo-search-form {
    display: flex;
    align-items: center;
    gap: 12px;
    height: 50px;
    padding: 5px 7px 5px 16px;
    border: 1px solid var(--promo-border);
    border-radius: 16px;
    background: #fff;
    color: #939396;
  }
  .is-large .promo-search-form {
    height: 62px;
    box-shadow: 0 4px 20px #29202a08;
  }
  .promo-search-form:focus-within {
    border-color: #d5365480;
  }
  .promo-search-form input {
    width: 100%;
    min-width: 0;
    padding: 5px 0;
    border: 0;
    background: transparent;
    outline: none;
    color: var(--promo-ink);
    font-size: 13px;
  }
  .promo-search-form input:focus-visible {
    outline: none;
  }
  .promo-search-submit {
    border-radius: 11px;
    padding: 8px 15px;
    font-size: 12px;
  }
  .is-large .promo-search-submit {
    padding: 11px 21px;
  }
  .promo-category-tabs {
    display: flex;
    align-items: stretch;
    justify-content: center;
    gap: 21px;
    margin: 30px auto 0;
    max-width: 1000px;
    overflow-x: auto;
    scrollbar-width: thin;
  }
  .promo-category-tabs button {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    flex: 0 0 auto;
    min-width: 56px;
    padding: 12px 4px 18px;
    border: 0;
    border-bottom: 2px solid transparent;
    background: transparent;
    color: #929294;
    font-size: 11px;
  }
  .promo-category-tabs button:hover {
    color: var(--promo-red);
  }
  .promo-category-tabs button.is-active {
    color: var(--promo-red);
    border-bottom-color: var(--promo-red);
    font-weight: 700;
  }
  .promo-home-content {
    padding: 26px 0 44px;
  }
  .promo-alert-banner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    border-radius: 16px;
    background: var(--promo-soft);
    padding: 22px 24px;
  }
  .promo-alert-banner strong {
    font-size: 14px;
    font-weight: 700;
  }
  .promo-alert-banner p {
    color: #858087;
    font-size: 12px;
    margin-top: 3px;
  }
  .promo-feed {
    margin-top: 44px;
  }
  .promo-section-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 18px;
  }
  .promo-section-heading h2 {
    font-size: 21px;
    font-weight: 750;
  }
  .promo-section-heading p {
    font-size: 12px;
    color: var(--promo-muted);
    margin-top: 3px;
  }
  .promo-product-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 24px;
  }
  .promo-product-card {
    min-width: 0;
  }
  .promo-product-image {
    position: relative;
    overflow: hidden;
    background: #f7f5f5;
    border-radius: 13px;
    aspect-ratio: 4 / 3;
  }
  .promo-product-image a {
    display: block;
    height: 100%;
  }
  .promo-product-image img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    transition: transform 0.25s;
  }
  .promo-product-image a:hover img {
    transform: scale(1.04);
  }
  .promo-like {
    position: absolute;
    top: 10px;
    right: 10px;
    display: grid;
    place-items: center;
    width: 32px;
    height: 32px;
    border: 0;
    border-radius: 50%;
    background: #ffffffdb;
    color: #747476;
  }
  .promo-like.is-liked {
    color: var(--promo-red);
    background: var(--promo-soft);
  }
  .promo-like.is-liked svg {
    fill: #d536541c;
  }
  .promo-product-title {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    margin-top: 11px;
    font-size: 14px;
    font-weight: 650;
  }
  .promo-product-title:hover {
    color: var(--promo-red);
  }
  .promo-product-meta {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    color: var(--promo-muted);
    font-size: 11px;
    margin-top: 3px;
  }
  .promo-product-meta span {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
  .promo-product-meta strong {
    white-space: nowrap;
    font-size: 11px;
    color: #545459;
    font-weight: 600;
  }
  .promo-product-footnote {
    font-size: 9px;
    color: #aaa6aa;
    margin-top: 3px !important;
  }
  .promo-preview-note {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    margin-top: 42px;
    padding: 23px 24px;
    background: #f8f8f8;
    border-radius: 16px;
  }
  .promo-preview-note svg {
    color: var(--promo-red);
  }
  .promo-preview-note strong {
    font-size: 14px;
  }
  .promo-preview-note p {
    color: var(--promo-muted);
    font-size: 12px;
    margin-top: 5px;
  }
  .promo-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
    padding: 30px max(32px, calc((100vw - 1280px) / 2));
    background: #f7f7f6;
    color: #99959b;
    font-size: 11px;
  }
  .promo-footer .promo-brand {
    font-size: 14px;
    gap: 7px;
  }
  .promo-footer .promo-brand svg {
    width: 14px;
    height: 16px;
  }
  .promo-footer p {
    margin-top: 7px;
  }
  .promo-empty {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    gap: 14px;
    min-height: 250px;
    text-align: center;
    padding: 40px 20px;
    color: var(--promo-muted);
  }
  .promo-empty svg {
    color: #d6b9c1;
  }
  .promo-empty h1,
  .promo-empty h2,
  .promo-empty h3 {
    color: var(--promo-ink);
  }
  .promo-empty p {
    font-size: 13px;
  }
  .promo-search-popover {
    position: absolute;
    z-index: 40;
    top: calc(100% + 12px);
    left: 50%;
    transform: translateX(-50%);
    width: min(1000px, calc(100vw - 32px));
    border: 1px solid var(--promo-border);
    border-radius: 22px;
    background: #fff;
    box-shadow: 0 15px 60px #38303720;
    text-align: left;
    overflow: hidden;
  }
  .promo-header-search .promo-search-popover {
    position: fixed;
    top: 104px;
  }
  .promo-popover-heading {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    padding: 22px 24px 8px;
  }
  .promo-popover-heading h2 {
    font-size: 18px;
  }
  .promo-popover-heading p {
    font-size: 12px;
    color: var(--promo-muted);
    margin-top: 5px;
  }
  .promo-popover-heading .promo-icon-button {
    border: 0;
  }
  .promo-popover-meta {
    display: flex;
    justify-content: space-between;
    padding: 8px 24px 15px;
    font-size: 12px;
    color: var(--promo-muted);
    border-bottom: 1px solid var(--promo-border);
  }
  .promo-popover-meta strong {
    color: var(--promo-red);
  }
  .promo-popover-scroll {
    max-height: min(480px, 58dvh);
    overflow-y: auto;
    overscroll-behavior: contain;
    padding: 20px 24px;
  }
  .promo-popover-grid {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 20px 16px;
  }
  .promo-popover-product {
    min-width: 0;
    text-align: left;
    border: 0;
    padding: 0;
    background: transparent;
    border-radius: 10px;
  }
  .promo-popover-product img {
    width: 100%;
    aspect-ratio: 1;
    object-fit: contain;
    border-radius: 12px;
    background: #f8f7f7;
  }
  .promo-popover-product strong {
    display: -webkit-box;
    overflow: hidden;
    height: 38px;
    margin-top: 9px;
    font-size: 12px;
    line-height: 1.6;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }
  .promo-popover-product span {
    display: block;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    font-size: 10px;
    color: var(--promo-muted);
    margin-top: 4px;
  }
  .promo-popover-product:hover strong {
    color: var(--promo-red);
  }
  .promo-load-more {
    display: flex;
    margin: 24px auto 4px;
  }
  .promo-search-page {
    display: grid;
    grid-template-columns: minmax(0, 56%) minmax(0, 44%);
    min-height: 680px;
    height: calc(100dvh - 116px);
  }
  .promo-store-panel {
    padding: 30px 36px;
    overflow: auto;
  }
  .promo-selected-product {
    display: flex;
    align-items: center;
    gap: 16px;
    background: #f7f7f6;
    border-radius: 18px;
    padding: 18px;
  }
  .promo-selected-product img {
    width: 70px;
    height: 70px;
    object-fit: contain;
    background: white;
    border-radius: 12px;
    flex: 0 0 auto;
  }
  .promo-selected-product > div {
    min-width: 0;
    flex: 1;
  }
  .promo-selected-product span {
    color: var(--promo-red);
    font-size: 11px;
    font-weight: 650;
  }
  .promo-selected-product h1 {
    font-size: 17px;
    display: -webkit-box;
    overflow: hidden;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }
  .promo-selected-product p {
    font-size: 11px;
    color: var(--promo-muted);
    margin-top: 4px;
  }
  .promo-selected-product .promo-button {
    padding: 9px 12px;
    font-size: 11px;
  }
  .promo-selected-product .promo-button span {
    color: inherit;
  }
  .promo-store-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    margin-top: 24px;
  }
  .promo-store-toolbar p {
    color: var(--promo-muted);
    font-size: 13px;
  }
  .promo-store-toolbar > div {
    display: flex;
    gap: 7px;
  }
  .promo-store-toolbar .promo-button {
    padding: 8px 12px;
    font-size: 12px;
  }
  .promo-small-disclaimer {
    margin-top: 10px !important;
    font-size: 10px;
    color: #9c9296;
  }
  .promo-store-list {
    margin-top: 8px;
  }
  .promo-store-card {
    padding: 20px 0 14px;
    border-bottom: 1px solid var(--promo-border);
    border-radius: 12px;
  }
  .promo-store-card.is-selected {
    background: #fdf6f8;
    box-shadow: inset 3px 0 var(--promo-red);
  }
  .promo-store-card-main {
    width: 100%;
    display: grid;
    grid-template-columns: 175px minmax(0, 1fr);
    gap: 22px;
    padding: 6px;
    border: 0;
    background: none;
    text-align: left;
    color: inherit;
  }
  .promo-store-card-main > img {
    width: 100%;
    height: 160px;
    object-fit: cover;
    border-radius: 13px;
    background: #faf6f7;
  }
  .promo-store-info {
    display: flex;
    flex-direction: column;
    min-width: 0;
    padding: 2px 0;
  }
  .promo-store-name {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }
  .promo-store-name h2 {
    font-size: 20px;
  }
  .promo-store-name h1 {
    font-size: 28px;
  }
  .promo-status {
    font-size: 11px;
    font-weight: 650;
    color: #34874b;
    background: #eaf5ed;
    border-radius: 20px;
    padding: 3px 9px;
    white-space: nowrap;
  }
  .promo-status.is-closed {
    background: #f3f3f3;
    color: #969698;
  }
  .promo-store-info p {
    font-size: 12px;
    color: var(--promo-muted);
    margin-top: 10px;
  }
  .promo-owned {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 10px;
    font-size: 12px;
    font-weight: 600;
  }
  .promo-owned svg {
    color: var(--promo-red);
  }
  .promo-store-bottom {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: auto;
    padding-top: 18px;
    font-size: 13px;
  }
  .promo-store-bottom > span {
    font-size: 10px;
    color: #a49da0;
  }
  .promo-store-detail-link {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 4px;
    color: var(--promo-red) !important;
    font-size: 12px;
    font-weight: 600;
    padding: 5px 8px 0;
  }
  .promo-map-intro h1 {
    font-size: 23px;
  }
  .promo-map-intro p {
    font-size: 12px;
    color: var(--promo-muted);
    margin-top: 8px;
  }
  .promo-map-panel {
    position: relative;
    min-width: 0;
    overflow: hidden;
  }
  .promo-map {
    position: relative;
    overflow: hidden;
    width: 100%;
    height: 100%;
    min-height: 500px;
    background: #ebe9e0;
  }
  .promo-map-canvas {
    position: absolute;
    inset: 0;
    transition: transform 0.3s;
    transform-origin: 50% 50%;
  }
  .promo-map-roads {
    position: absolute;
    width: 100%;
    height: 100%;
  }
  .promo-map-label {
    position: absolute;
    font-size: 14px;
    color: #a4a195;
  }
  .promo-map-station {
    position: absolute;
    left: 43%;
    top: 54%;
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 7px 10px;
    background: #fff;
    border-radius: 30px;
    font-size: 11px;
    box-shadow: 0 3px 9px #0001;
    white-space: nowrap;
  }
  .promo-map-station i {
    width: 11px;
    height: 11px;
    border-radius: 50%;
    background: #51a264;
  }
  .promo-map-pin {
    position: absolute;
    display: flex;
    flex-direction: column;
    align-items: center;
    transform: translate(-50%, -50%);
    padding: 10px 14px;
    border: 1px solid #fff;
    border-radius: 25px;
    background: #fff;
    box-shadow: 0 3px 12px #0002;
    font-size: 10px;
    font-weight: 650;
    color: #333;
    white-space: nowrap;
  }
  .promo-map-pin span {
    font-size: 13px;
  }
  .promo-map-pin.is-selected {
    color: #fff;
    background: #242424;
    border-color: #242424;
    z-index: 2;
  }
  .promo-map-research {
    position: absolute;
    top: 24px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 7px;
    border: 0;
    border-radius: 25px;
    background: #fff;
    box-shadow: 0 3px 12px #0002;
    padding: 13px 20px;
    white-space: nowrap;
    font-size: 12px;
    font-weight: 650;
  }
  .promo-map-controls {
    position: absolute;
    top: 24px;
    right: 18px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .promo-map-controls .promo-icon-button {
    border-radius: 12px;
    width: 39px;
    height: 39px;
    box-shadow: 0 3px 10px #0001;
    border: 0;
  }
  .promo-map-disclaimer {
    position: absolute;
    bottom: 12px;
    left: 50%;
    transform: translateX(-50%);
    padding: 4px 10px;
    border-radius: 5px;
    background: #ffffffd9;
    font-size: 9px;
    color: #78746e;
    white-space: nowrap;
  }
  .promo-map-selected {
    position: absolute;
    bottom: 44px;
    left: 18px;
    right: 18px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;
    border-radius: 14px;
    background: #fff;
    box-shadow: 0 3px 20px #0001;
    font-size: 13px;
  }
  .promo-map-selected a {
    display: inline-flex;
    align-items: center;
    color: var(--promo-red);
    font-size: 12px;
  }
  .promo-mobile-view-switch {
    display: none;
  }
  .promo-store-page {
    max-width: 1120px;
    padding: 28px 0 52px;
  }
  .promo-breadcrumb {
    display: inline-block;
    font-size: 11px;
    color: #989398 !important;
    margin-bottom: 20px;
  }
  .promo-store-page-heading {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 20px;
    margin-bottom: 24px;
  }
  .promo-store-page-heading p {
    font-size: 12px;
    color: var(--promo-muted);
    margin-top: 7px;
  }
  .promo-store-page-actions {
    display: flex;
    gap: 18px;
  }
  .promo-store-gallery {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr;
    grid-template-rows: repeat(2, 185px);
    gap: 8px;
    border-radius: 16px;
    overflow: hidden;
  }
  .promo-store-gallery button {
    border: 0;
    padding: 0;
    background: #f7f3f5;
    overflow: hidden;
  }
  .promo-store-gallery button:first-child {
    grid-row: 1 / 3;
  }
  .promo-store-gallery img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s;
  }
  .promo-store-gallery button:hover img {
    transform: scale(1.04);
  }
  .promo-store-facts {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
    margin-top: 26px;
  }
  .promo-store-facts > div {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 17px;
    border: 1px solid var(--promo-border);
    border-radius: 13px;
  }
  .promo-store-facts strong {
    font-size: 12px;
    font-weight: 550;
  }
  .promo-detail-section {
    padding: 28px 0;
    border-bottom: 1px solid var(--promo-border);
  }
  .promo-detail-section h2,
  .promo-store-info-grid h2 {
    font-size: 19px;
    margin-bottom: 13px;
  }
  .promo-detail-section > p {
    font-size: 13px;
    line-height: 1.9;
    color: #79757b;
  }
  .promo-detail-section > p + p {
    margin-top: 7px;
  }
  .promo-price-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    padding: 13px 0;
    font-size: 13px;
  }
  .promo-price-row p {
    color: var(--promo-muted);
    font-size: 11px;
    margin-top: 3px;
  }
  .promo-price-row > span {
    font-size: 11px;
    color: var(--promo-muted);
  }
  .promo-inline-label {
    display: inline-block;
    padding: 3px 8px;
    border-radius: 20px;
    color: #9e6474;
    background: var(--promo-soft);
    font-size: 10px;
    font-weight: 500;
    vertical-align: middle;
    white-space: nowrap;
  }
  .promo-store-info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 60px;
    padding: 28px 0;
  }
  .promo-store-info-grid dl {
    margin: 0;
    font-size: 12px;
  }
  .promo-store-info-grid dl > div {
    display: flex;
    justify-content: space-between;
    padding: 6px 0;
    gap: 16px;
  }
  .promo-store-info-grid dt {
    color: var(--promo-muted);
  }
  .promo-store-info-grid dd {
    margin: 0;
  }
  .promo-store-info-grid p {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    padding: 5px 0;
    color: #777;
  }
  .promo-back-link {
    margin-top: 4px;
  }
  .promo-market-page {
    padding: 44px 0 60px;
  }
  .promo-market-heading {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
  }
  .promo-market-heading h1 {
    font-size: 34px;
  }
  .promo-heading-chevron {
    color: #444;
    font-size: 24px;
    margin-left: 8px;
  }
  .promo-market-heading p {
    margin-top: 10px;
    color: var(--promo-muted);
    font-size: 15px;
  }
  .promo-market-tools {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    flex-wrap: wrap;
    margin-top: 26px;
  }
  .promo-market-chips {
    display: flex;
    gap: 9px;
    flex-wrap: wrap;
  }
  .promo-market-chips button {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 10px 17px;
    border: 0;
    border-radius: 24px;
    background: #f6f6f5;
    color: #777;
    font-size: 13px;
    font-weight: 650;
  }
  .promo-market-chips button.is-active {
    background: var(--promo-red);
    color: #fff;
  }
  .promo-market-search {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 14px;
    border: 1px solid var(--promo-border);
    border-radius: 24px;
    color: var(--promo-muted);
  }
  .promo-market-search input {
    width: 215px;
    min-width: 0;
    border: 0;
    outline: none;
    background: transparent;
    font-size: 12px;
  }
  .promo-market-search:focus-within {
    border-color: var(--promo-red);
  }
  .promo-market-layout {
    display: grid;
    grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr);
    gap: 40px;
    margin-top: 32px;
  }
  .promo-listing {
    width: 100%;
    display: grid;
    grid-template-columns: 125px minmax(0, 1fr) 18px;
    gap: 22px;
    align-items: center;
    padding: 21px 0;
    border: 0;
    border-bottom: 1px solid var(--promo-border);
    background: transparent;
    color: inherit;
    text-align: left;
  }
  .promo-listing img {
    width: 125px;
    height: 125px;
    border-radius: 12px;
    object-fit: contain;
    background: #f7f5f6;
  }
  .promo-listing h3 {
    font-size: 18px;
  }
  .promo-listing p {
    color: var(--promo-muted);
    font-size: 12px;
    margin-top: 8px;
  }
  .promo-listing strong {
    display: block;
    font-size: 17px;
    margin-top: 9px;
  }
  .promo-listing strong span {
    font-size: 10px;
    font-weight: 400;
    color: #999;
    margin-left: 6px;
  }
  .promo-listing .promo-listing-tags {
    font-size: 11px;
    color: #aaa;
  }
  .promo-listing:hover h3 {
    color: var(--promo-red);
  }
  .promo-market-sidebar {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  .promo-market-sidebar > div {
    padding: 25px 27px;
    border-radius: 18px;
    background: #f7f7f6;
  }
  .promo-market-sidebar h2 {
    font-size: 19px;
  }
  .promo-market-sidebar p {
    color: var(--promo-muted);
    font-size: 13px;
    margin-top: 12px;
  }
  .promo-market-sidebar .promo-market-cta {
    background: var(--promo-soft);
  }
  .promo-market-cta .promo-button {
    margin-top: 17px;
    border-radius: 13px;
  }
  .promo-market-spots p {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    font-weight: 550;
    color: #444;
  }
  .promo-market-spots svg {
    color: var(--promo-red);
  }
  .promo-market-sidebar .promo-market-manners {
    border: 1px solid var(--promo-border);
    background: #fff;
  }
  .promo-market-manners h2 {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .promo-market-manners svg {
    color: var(--promo-red);
  }
  .promo-dialog {
    width: min(460px, calc(100vw - 32px));
    max-height: calc(100dvh - 40px);
    padding: 0;
    border: 0;
    border-radius: 24px;
    box-shadow: 0 24px 80px #0003;
    color: var(--promo-ink);
  }
  .promo-dialog::backdrop,
  .promo-image-viewer::backdrop {
    background: #24212b70;
    backdrop-filter: blur(3px);
  }
  .promo-dialog-content {
    position: relative;
    padding: 42px 30px 30px;
    text-align: center;
  }
  .promo-dialog-close {
    position: absolute;
    top: 12px;
    right: 12px;
    border: 0;
  }
  .promo-dialog-symbol {
    display: grid;
    place-items: center;
    width: 65px;
    height: 65px;
    margin: 0 auto 20px;
    background: var(--promo-soft);
    color: var(--promo-red);
    border-radius: 20px;
  }
  .promo-dialog h2 {
    font-size: 22px;
  }
  .promo-dialog p {
    font-size: 13px;
    line-height: 1.85;
    margin-top: 13px;
  }
  .promo-dialog .promo-muted {
    font-size: 11px;
  }
  .promo-dialog .promo-button {
    width: 100%;
    margin-top: 24px;
  }
  .promo-image-viewer {
    width: min(900px, calc(100vw - 24px));
    max-height: calc(100dvh - 30px);
    border: 0;
    border-radius: 18px;
    padding: 52px 16px 16px;
    background: #fff;
  }
  .promo-image-viewer .promo-icon-button {
    position: absolute;
    top: 8px;
    right: 8px;
  }
  .promo-image-viewer img {
    max-height: calc(100dvh - 120px);
    width: 100%;
    object-fit: contain;
  }
  @media (max-width: 1200px) {
    .promo-header {
      gap: 18px;
      padding-inline: 24px;
    }
    .promo-brand {
      font-size: 20px;
      gap: 9px;
    }
    .promo-navigation {
      gap: 3px;
    }
    .promo-navigation a {
      padding: 9px 13px;
      font-size: 13px;
    }
    .promo-header-actions {
      gap: 6px;
    }
    .promo-header-actions .promo-icon-button {
      width: 34px;
      height: 34px;
    }
    .promo-store-panel {
      padding: 24px;
    }
    .promo-store-card-main {
      grid-template-columns: 120px minmax(0, 1fr);
      gap: 15px;
    }
    .promo-store-card-main > img {
      height: 142px;
    }
    .promo-store-name h2 {
      font-size: 17px;
    }
    .promo-store-bottom {
      font-size: 11px;
    }
    .promo-store-info p {
      font-size: 11px;
    }
    .promo-owned {
      font-size: 11px;
    }
    .promo-selected-product {
      gap: 10px;
      padding: 14px;
    }
    .promo-selected-product h1 {
      font-size: 15px;
    }
    .promo-selected-product > .promo-button {
      padding: 10px;
    }
    .promo-selected-product > .promo-button span {
      display: none;
    }
    .promo-category-tabs {
      gap: 13px;
    }
  }
  @media (max-width: 900px) {
    .promo-container {
      width: calc(100% - 48px);
    }
    .promo-header-actions > button:first-child {
      display: none;
    }
    .promo-header .promo-brand span {
      font-size: 18px;
    }
    .promo-header {
      gap: 12px;
    }
    .promo-header-search .promo-search-submit {
      padding-inline: 10px;
    }
    .promo-popover-grid {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
    .promo-category-tabs {
      justify-content: flex-start;
    }
    .promo-product-grid {
      gap: 16px;
    }
    .promo-product-title {
      font-size: 12px;
    }
    .promo-store-toolbar {
      flex-wrap: wrap;
    }
    .promo-store-toolbar > div {
      margin-left: auto;
    }
    .promo-store-card-main {
      grid-template-columns: 95px minmax(0, 1fr);
      gap: 12px;
    }
    .promo-store-card-main > img {
      height: 130px;
    }
    .promo-market-layout {
      gap: 25px;
    }
    .promo-listing {
      grid-template-columns: 90px minmax(0, 1fr) 15px;
      gap: 14px;
    }
    .promo-listing img {
      width: 90px;
      height: 100px;
    }
    .promo-listing h3 {
      font-size: 15px;
    }
    .promo-market-sidebar > div {
      padding: 22px;
    }
  }
  @media (max-width: 767px) {
    .promo-banner-extra {
      display: none;
    }
    .promo-demo-banner {
      font-size: 10px;
    }
    .promo-header {
      min-height: 70px;
      flex-wrap: wrap;
      gap: 12px 8px;
      padding: 12px 16px;
    }
    .promo-header .promo-brand {
      gap: 6px;
    }
    .promo-header .promo-brand span {
      font-size: 16px;
    }
    .promo-header .promo-brand svg {
      width: 19px;
      height: 21px;
    }
    .promo-navigation {
      margin-left: auto;
      gap: 1px;
    }
    .promo-navigation a {
      padding: 8px 11px;
      font-size: 12px;
    }
    .promo-header-actions {
      display: none;
    }
    .promo-header-search {
      display: none;
    }
    .promo-mobile-search {
      display: block;
      width: 100%;
    }
    .promo-container {
      width: calc(100% - 32px);
    }
    .promo-hero {
      padding: 36px 16px 0;
    }
    .promo-hero h1 {
      font-size: 23px;
      margin-bottom: 22px;
    }
    .promo-eyebrow {
      font-size: 10px;
    }
    .is-large .promo-search-form {
      height: 56px;
    }
    .promo-search-form input {
      font-size: 12px;
    }
    .promo-category-tabs {
      margin-top: 22px;
      gap: 12px;
      scrollbar-width: none;
    }
    .promo-category-tabs button {
      min-width: 50px;
      font-size: 10px;
      padding-bottom: 14px;
    }
    .promo-home-content {
      padding-top: 20px;
    }
    .promo-alert-banner {
      padding: 20px;
      align-items: flex-start;
      flex-direction: column;
      gap: 13px;
    }
    .promo-alert-banner strong {
      font-size: 13px;
    }
    .promo-alert-banner p {
      font-size: 11px;
    }
    .promo-alert-banner .promo-button {
      padding: 9px 14px;
      font-size: 11px;
    }
    .promo-feed {
      margin-top: 30px;
    }
    .promo-section-heading h2 {
      font-size: 18px;
    }
    .promo-section-heading p {
      font-size: 11px;
    }
    .promo-section-heading {
      gap: 8px;
    }
    .promo-section-heading .promo-text-button {
      font-size: 11px;
    }
    .promo-product-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 22px 14px;
    }
    .promo-product-image {
      aspect-ratio: 1;
    }
    .promo-product-title {
      font-size: 12px;
    }
    .promo-product-meta {
      font-size: 10px;
      gap: 4px;
    }
    .promo-product-meta strong {
      font-size: 10px;
    }
    .promo-like {
      width: 28px;
      height: 28px;
      top: 7px;
      right: 7px;
    }
    .promo-like svg {
      width: 17px;
      height: 17px;
    }
    .promo-preview-note {
      padding: 20px;
    }
    .promo-preview-note p {
      font-size: 11px;
    }
    .promo-footer {
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;
      padding: 25px 20px;
      font-size: 10px;
    }
    .promo-search-popover {
      width: calc(100vw - 24px);
      border-radius: 18px;
    }
    .promo-popover-heading {
      padding: 18px 16px 6px;
    }
    .promo-popover-heading h2 {
      font-size: 15px;
    }
    .promo-popover-heading p {
      font-size: 10px;
    }
    .promo-popover-meta {
      padding-inline: 16px;
      font-size: 11px;
    }
    .promo-popover-scroll {
      padding: 16px;
      max-height: 54dvh;
    }
    .promo-popover-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 18px 14px;
    }
    .promo-popover-product strong {
      font-size: 11px;
      height: 36px;
    }
    .promo-search-page {
      display: flex;
      flex-direction: column;
      height: auto;
      min-height: 570px;
    }
    .promo-mobile-view-switch {
      display: flex;
      gap: 7px;
      padding: 15px 16px 0;
    }
    .promo-mobile-view-switch button {
      flex: 1;
      padding: 8px 10px;
      border: 1px solid var(--promo-border);
      border-radius: 22px;
      background: #fff;
      color: #888;
      font-size: 12px;
    }
    .promo-mobile-view-switch button.is-active {
      background: var(--promo-soft);
      color: var(--promo-red);
      border-color: #d5365430;
      font-weight: 650;
    }
    .promo-mobile-hidden {
      display: none;
    }
    .promo-store-panel {
      padding: 20px 16px;
      overflow: visible;
    }
    .promo-selected-product img {
      width: 56px;
      height: 56px;
    }
    .promo-selected-product span {
      font-size: 10px;
    }
    .promo-selected-product h1 {
      font-size: 14px;
    }
    .promo-selected-product .promo-button {
      padding: 8px;
      width: 33px;
      height: 33px;
    }
    .promo-store-toolbar p {
      font-size: 12px;
    }
    .promo-store-toolbar .promo-button {
      padding: 7px 9px;
      font-size: 10px;
      gap: 4px;
    }
    .promo-store-toolbar .promo-button svg {
      width: 13px;
    }
    .promo-store-card-main {
      grid-template-columns: 105px minmax(0, 1fr);
      gap: 12px;
      padding: 4px;
    }
    .promo-store-card-main > img {
      height: 123px;
    }
    .promo-store-name {
      gap: 6px;
    }
    .promo-store-name h2 {
      font-size: 16px;
    }
    .promo-status {
      font-size: 9px;
      padding: 2px 6px;
    }
    .promo-store-info p {
      margin-top: 7px;
      font-size: 10px;
    }
    .promo-owned {
      margin-top: 8px;
      font-size: 10px;
    }
    .promo-owned svg {
      width: 14px;
    }
    .promo-store-bottom {
      font-size: 11px;
      padding-top: 13px;
    }
    .promo-store-bottom > span {
      font-size: 9px;
    }
    .promo-store-detail-link {
      font-size: 11px;
    }
    .promo-map-panel {
      margin-top: 16px;
      min-height: 550px;
      height: calc(100dvh - 225px);
    }
    .promo-map {
      min-height: 550px;
    }
    .promo-map-research {
      top: 20px;
      font-size: 11px;
      padding: 11px 15px;
    }
    .promo-map-controls {
      top: 20px;
      right: 12px;
    }
    .promo-map-pin {
      padding: 8px 11px;
      font-size: 9px;
    }
    .promo-map-pin span {
      font-size: 12px;
    }
    .promo-store-page {
      padding-top: 22px;
    }
    .promo-store-page-heading {
      align-items: flex-start;
      flex-direction: column;
      gap: 10px;
    }
    .promo-store-page .promo-store-name h1 {
      font-size: 25px;
    }
    .promo-store-page-actions {
      font-size: 12px;
    }
    .promo-store-gallery {
      grid-template-columns: 2fr 1fr;
      grid-template-rows: repeat(2, 130px);
      gap: 5px;
    }
    .promo-store-gallery button:nth-child(n + 4) {
      display: none;
    }
    .promo-store-facts {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 8px;
      margin-top: 20px;
    }
    .promo-store-facts > div {
      padding: 14px;
    }
    .promo-store-facts strong {
      font-size: 10px;
    }
    .promo-detail-section {
      padding: 23px 0;
    }
    .promo-detail-section h2,
    .promo-store-info-grid h2 {
      font-size: 17px;
    }
    .promo-detail-section > p {
      font-size: 12px;
    }
    .promo-price-row {
      font-size: 12px;
    }
    .promo-store-info-grid {
      grid-template-columns: 1fr;
      gap: 24px;
      padding: 24px 0;
    }
    .promo-market-page {
      padding-top: 28px;
    }
    .promo-market-heading {
      align-items: flex-start;
      gap: 8px;
    }
    .promo-market-heading h1 {
      font-size: 28px;
    }
    .promo-market-heading p {
      font-size: 12px;
      margin-top: 6px;
    }
    .promo-market-heading .promo-inline-label {
      font-size: 8px;
      margin-top: 10px;
    }
    .promo-market-tools {
      margin-top: 21px;
      gap: 14px;
    }
    .promo-market-chips {
      gap: 6px;
    }
    .promo-market-chips button {
      font-size: 11px;
      padding: 8px 12px;
    }
    .promo-market-search {
      width: 100%;
    }
    .promo-market-search input {
      flex: 1;
      width: 100%;
    }
    .promo-market-layout {
      grid-template-columns: 1fr;
      gap: 28px;
      margin-top: 24px;
    }
    .promo-listing {
      grid-template-columns: 98px minmax(0, 1fr) 14px;
      padding: 18px 0;
      gap: 13px;
    }
    .promo-listing img {
      width: 98px;
      height: 104px;
    }
    .promo-listing h3 {
      font-size: 14px;
    }
    .promo-listing p {
      font-size: 10px;
      margin-top: 6px;
    }
    .promo-listing strong {
      font-size: 15px;
      margin-top: 7px;
    }
    .promo-listing strong span {
      font-size: 9px;
    }
    .promo-market-sidebar h2 {
      font-size: 18px;
    }
    .promo-market-sidebar p {
      font-size: 12px;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .promo *,
    .promo *::before,
    .promo *::after {
      transition: none !important;
      scroll-behavior: auto !important;
    }
  }
`;

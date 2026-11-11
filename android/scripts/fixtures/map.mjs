import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';

import { GlobalStyles } from 'gachi-web-global-styles';
import { Page, MobileHeaderLayer } from 'gachi-web-map-page-styles';
import { Section, ListArea, MapArea } from 'gachi-web-map-results-styles';
import { Panel as MapPanel } from 'gachi-web-map-panel-styles';
import { MapFrame, MapCanvas, MapControls } from 'gachi-web-map-styles';
import { CurrentLocationButton } from 'gachi-web-location-button';
import { MapZoomControls } from 'gachi-web-map-zoom-controls';
import { StoreListPanel } from 'gachi-web-store-list';
import {
  Header,
  HeaderContent,
  SearchArea,
  MapSearchEntry,
  MobileTabBar,
  MobileTab,
  ActionIcon,
} from 'gachi-web-header-styles';

// The route owner and map SDK are test substitutes. All layout CSS, the store
// carousel/dialog/cards and map controls are imported from the real web source.
const h = React.createElement;
const stores = Array.from({ length: 5 }, (_, index) => ({
  storeId: index + 1,
  name: `홍대 가챠 매장 ${index + 1}`,
  thumbnailUrl: null,
  address: `서울 마포구 와우산로 ${index + 1}`,
  floor: 1,
  unit: [],
  latitude: 37.5563 + index / 10000,
  longitude: 126.9236,
  distance: index * 100,
  gachaCount: index + 10,
}));
const success = (selectedStores) => ({
  status: 'success',
  errorMessage: null,
  data: {
    center: { latitude: 37.5563, longitude: 126.9236 },
    radius: 3000,
    stores: selectedStores,
  },
});
window.mapOpenedStores = [];
window.mapSelectedStores = [];
window.mapNavigation = [];
window.mapControlActions = [];
window.mapRetryCount = 0;
window.mapPointerEvents = [];
document.addEventListener(
  'pointerdown',
  (event) => {
    window.mapPointerEvents.push({
      trusted: event.isTrusted,
      pointerType: event.pointerType,
    });
  },
  true,
);

function MapFixture() {
  const [stateName, setStateName] = useState('success');
  const [selectedStoreId, setSelectedStoreId] = useState(1);
  const [mapVisible, setMapVisible] = useState(true);
  const [hasTabs, setHasTabs] = useState(
    !new URLSearchParams(location.search).has('legacy'),
  );
  const state =
    stateName === 'empty'
      ? success([])
      : stateName === 'loading'
        ? { status: 'loading', data: null, errorMessage: null }
        : stateName === 'error'
          ? {
              status: 'error',
              data: null,
              errorMessage: '매장 목록을 불러오지 못했어요.',
            }
          : success(stores);

  useEffect(() => {
    window.mapFixture = {
      stateName,
      selectedStoreId,
      setState: setStateName,
      setHasTabs,
      navigate(path) {
        history.pushState({}, '', path);
        setMapVisible(path === '/map');
        window.dispatchEvent(new PopStateEvent('popstate'));
      },
    };
  }, [stateName, selectedStoreId]);

  return h(
    React.Fragment,
    null,
    h(GlobalStyles),
    h(
      Page,
      { 'data-fixture-map-page': '' },
      h(
        MobileHeaderLayer,
        null,
        h(
          Header,
          {
            'data-mobile-tabs': hasTabs || undefined,
            'data-mobile-variant': 'map',
          },
          h(
            HeaderContent,
            null,
            h(
              SearchArea,
              { 'data-header-search-slot': '' },
              h(MapSearchEntry, { to: '/search' }, '교환글, 가챠, 매장 검색'),
            ),
          ),
        ),
        hasTabs &&
          h(
            MobileTabBar,
            { 'aria-label': '하단 메뉴' },
            ...[
              ['/trade', '홈'],
              ['/map', '지도'],
              ['/chat', '채팅'],
              ['/mypage', '마이'],
            ].map(([to, label]) =>
              h(
                MobileTab,
                {
                  key: to,
                  to,
                  'aria-current': to === '/map' ? 'page' : undefined,
                  onClick: (event) => {
                    event.preventDefault();
                    window.mapNavigation.push(to);
                  },
                },
                h(
                  ActionIcon,
                  { viewBox: '0 0 24 24', 'aria-hidden': true },
                  h('circle', {
                    cx: 12,
                    cy: 12,
                    r: 7,
                    fill: 'none',
                    stroke: 'currentColor',
                  }),
                ),
                label,
              ),
            ),
          ),
      ),
      mapVisible &&
        h(
          Section,
          { 'aria-label': '홍대 가챠 매장', 'data-fixture-results': '' },
          h(
            ListArea,
            { 'data-fixture-list-area': '' },
            h(StoreListPanel, {
              storesState: state,
              isGachaSelected: false,
              selectedStoreId,
              onOpenStore: (id) => window.mapOpenedStores.push(id),
              onSelectStore: (id) => {
                window.mapSelectedStores.push(id);
                setSelectedStoreId(id);
              },
              onRetry: () => {
                window.mapRetryCount += 1;
                setStateName('success');
              },
            }),
          ),
          h(
            MapArea,
            null,
            h(
              MapPanel,
              null,
              h(
                MapFrame,
                { role: 'region', 'aria-label': '홍대 가챠 매장 지도' },
                h(MapCanvas, { 'data-fixture-map-canvas': '' }),
                h(
                  MapControls,
                  { 'data-fixture-map-controls': '' },
                  h(MapZoomControls, {
                    onZoomIn: () => window.mapControlActions.push('zoom-in'),
                    onZoomOut: () => window.mapControlActions.push('zoom-out'),
                  }),
                  h(CurrentLocationButton, {
                    onLocate: () => window.mapControlActions.push('locate'),
                  }),
                ),
              ),
            ),
          ),
        ),
    ),
  );
}

createRoot(document.getElementById('root')).render(
  h(BrowserRouter, null, h(MapFixture)),
);

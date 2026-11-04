const API_KEY = process.env.POSTHOG_PERSONAL_API_KEY;
const PROJECT_ID = process.env.POSTHOG_PROJECT_ID;
const HOST = (process.env.POSTHOG_HOST ?? 'https://us.posthog.com').replace(
  /\/$/,
  '',
);
const APPLY_CHANGES = process.argv.includes('--apply');

if (!API_KEY || !PROJECT_ID) {
  throw new Error(
    'POSTHOG_PERSONAL_API_KEY와 POSTHOG_PROJECT_ID 환경변수가 필요합니다.',
  );
}

const productionFilter = {
  key: 'environment',
  operator: 'exact',
  type: 'event',
  value: ['production'],
};

function exact(key, value) {
  return {
    key,
    operator: 'exact',
    type: 'event',
    value: Array.isArray(value) ? value : [value],
  };
}

function personPropertyIsSet(key) {
  return {
    key,
    operator: 'is_set',
    type: 'person',
    value: 'is_set',
  };
}

function event(eventName, options = {}) {
  return {
    kind: 'EventsNode',
    event: eventName,
    name: eventName,
    math: options.math ?? 'total',
    ...(options.label ? { custom_name: options.label } : {}),
    ...(options.properties?.length ? { properties: options.properties } : {}),
  };
}

function trends({
  series,
  display = 'ActionsLineGraph',
  interval = 'day',
  dateFrom = '-30d',
  breakdown,
}) {
  return {
    kind: 'InsightVizNode',
    source: {
      kind: 'TrendsQuery',
      version: 4,
      series,
      interval,
      dateRange: { date_from: dateFrom, explicitDate: false },
      properties: [productionFilter],
      trendsFilter: {
        display,
        showLegend: series.length > 1 || Boolean(breakdown),
        yAxisScaleType: 'linear',
        showValuesOnSeries: false,
        smoothingIntervals: 1,
        showPercentStackView: false,
        aggregationAxisFormat: 'numeric',
        showAlertThresholdLines: false,
      },
      breakdownFilter: breakdown
        ? { breakdown, breakdown_type: 'event' }
        : { breakdown_type: 'event' },
      filterTestAccounts: false,
    },
  };
}

function funnel({ series, dateFrom = '-30d' }) {
  return {
    kind: 'InsightVizNode',
    source: {
      kind: 'FunnelsQuery',
      version: 2,
      series,
      interval: 'day',
      dateRange: { date_from: dateFrom, explicitDate: false },
      properties: [productionFilter],
      funnelsFilter: {
        layout: 'horizontal',
        exclusions: [],
        funnelVizType: 'steps',
        funnelOrderType: 'ordered',
        funnelStepReference: 'total',
        funnelWindowInterval: 14,
        funnelWindowIntervalUnit: 'day',
        breakdownAttributionType: 'first_touch',
      },
      breakdownFilter: { breakdown_type: 'event' },
      filterTestAccounts: false,
    },
  };
}

function retention(eventName) {
  return {
    kind: 'InsightVizNode',
    source: {
      kind: 'RetentionQuery',
      version: 2,
      dateRange: { date_from: '-90d', explicitDate: false },
      properties: [productionFilter],
      retentionFilter: {
        period: 'Week',
        targetEntity: { id: eventName, type: 'events' },
        returningEntity: { id: eventName, type: 'events' },
        retentionType: 'retention_first_time',
        totalIntervals: 11,
      },
      filterTestAccounts: false,
    },
  };
}

const dashboardDefinitions = [
  {
    name: '가치가챠 핵심 지표',
    description:
      '실제 서비스 가치가 발생했는지 보는 운영 대시보드입니다. 모든 카드에는 environment=production 필터를 적용하고 한글 지표명에 원본 이벤트 태그를 병기합니다.',
    pinned: true,
    tags: ['gachi-gacha', 'production', 'managed-by-code'],
    insights: [
      {
        name: '최근 30일 전체 고유 사용자 [$pageview]',
        description:
          '운영 환경에서 페이지를 한 번 이상 조회한 최근 30일 고유 사용자 수입니다. 같은 사용자의 반복 방문은 한 명으로 계산합니다.',
        query: trends({
          display: 'BoldNumber',
          series: [event('$pageview', { math: 'dau' })],
        }),
      },
      {
        name: '누적 식별 회원 수 [person.member_id]',
        description:
          '운영 환경에서 회원 ID로 식별된 뒤 페이지를 조회한 누적 고유 회원 수입니다. 분석 도입 이후 로그인한 회원만 포함하므로 DB의 전체 가입자 수와는 다를 수 있습니다.',
        query: trends({
          display: 'BoldNumber',
          dateFrom: 'all',
          series: [
            event('$pageview', {
              math: 'dau',
              properties: [personPropertyIsSet('member_id')],
            }),
          ],
        }),
      },
      {
        name: '핵심 행동 WAU [store_discovery_succeeded 외 2종]',
        description:
          '매장 발견(store_discovery_succeeded), 교환글 등록 성공(trade_form_completed), 메시지 전송 성공(chat_message_send_completed) 중 하나 이상을 수행한 주간 고유 사용자입니다.',
        query: trends({
          interval: 'week',
          dateFrom: '-90d',
          series: [
            {
              kind: 'GroupNode',
              math: 'dau',
              name: '핵심 가치 행동',
              operator: 'OR',
              nodes: [
                event('store_discovery_succeeded'),
                event('trade_form_completed', {
                  properties: [
                    exact('mode', 'create'),
                    exact('outcome', 'success'),
                  ],
                }),
                event('chat_message_send_completed', {
                  properties: [exact('outcome', 'success')],
                }),
              ],
            },
          ],
        }),
      },
      {
        name: '최근 30일 매장 발견 사용자 [store_discovery_succeeded]',
        description:
          '가챠를 보유한 매장이 한 곳 이상 검색된 고유 사용자 수입니다.',
        query: trends({
          display: 'BoldNumber',
          series: [event('store_discovery_succeeded', { math: 'dau' })],
        }),
      },
      {
        name: '최근 30일 교환글 등록 성공 [trade_form_completed]',
        description:
          'mode=create, outcome=success 조건의 교환글 등록 성공 건수입니다.',
        query: trends({
          display: 'BoldNumber',
          series: [
            event('trade_form_completed', {
              properties: [
                exact('mode', 'create'),
                exact('outcome', 'success'),
              ],
            }),
          ],
        }),
      },
      {
        name: '최근 30일 댓글 등록 성공 [trade_comment_submission_completed]',
        description:
          'outcome=success인 댓글 등록 성공 건수입니다. 댓글 본문·닉네임·IP는 수집하지 않습니다.',
        query: trends({
          display: 'BoldNumber',
          series: [
            event('trade_comment_submission_completed', {
              properties: [exact('outcome', 'success')],
            }),
          ],
        }),
      },
      {
        name: '최근 30일 댓글 작성 후 채팅 선택 [trade_chat_started.comment_context]',
        description:
          '현재 거래 상세 방문에서 댓글 등록에 성공한 뒤 채팅하기를 선택한 건수입니다. 과거 댓글 작성 이력이나 실제 메시지 전송 건수와는 구분합니다.',
        query: trends({
          display: 'BoldNumber',
          series: [
            event('trade_chat_started', {
              properties: [exact('comment_context', 'submitted_this_session')],
            }),
          ],
        }),
      },
      {
        name: '최근 30일 신규 채팅방 [chat_room_entry_completed]',
        description:
          'outcome=success, room_was_created=true인 신규 연결 건수입니다.',
        query: trends({
          display: 'BoldNumber',
          series: [
            event('chat_room_entry_completed', {
              properties: [
                exact('outcome', 'success'),
                exact('room_was_created', true),
              ],
            }),
          ],
        }),
      },
      {
        name: '가챠 검색→매장 상세 퍼널 [gacha_search_submitted → store_opened]',
        description:
          '검색 제출, 가챠 선택, 보유 매장 발견, 매장 상세 진입의 14일 전환 퍼널입니다.',
        query: funnel({
          series: [
            event('gacha_search_submitted', { label: '가챠 검색 제출' }),
            event('gacha_selected', { label: '가챠 선택' }),
            event('store_discovery_succeeded', { label: '보유 매장 발견' }),
            event('store_opened', { label: '매장 상세 진입' }),
          ],
        }),
      },
      {
        name: '교환글 등록 퍼널 [trade_create_started → trade_form_completed]',
        description:
          '교환글 작성 진입부터 유효 폼 제출, 등록 성공까지의 14일 전환 퍼널입니다.',
        query: funnel({
          series: [
            event('trade_create_started', { label: '작성 진입' }),
            event('trade_form_submitted', {
              label: '유효 폼 제출',
              properties: [exact('mode', 'create')],
            }),
            event('trade_form_completed', {
              label: '등록 성공',
              properties: [
                exact('mode', 'create'),
                exact('outcome', 'success'),
              ],
            }),
          ],
        }),
      },
      {
        name: '교환 연결 퍼널 [trade_selected → chat_message_send_completed]',
        description:
          '교환글 조회가 채팅방 진입과 실제 메시지 전송으로 이어지는지 확인합니다.',
        query: funnel({
          series: [
            event('trade_selected', { label: '교환글 선택' }),
            event('trade_chat_started', { label: '채팅 선택' }),
            event('chat_room_entry_completed', {
              label: '채팅방 진입 성공',
              properties: [exact('outcome', 'success')],
            }),
            event('chat_message_send_completed', {
              label: '메시지 전송 성공',
              properties: [exact('outcome', 'success')],
            }),
          ],
        }),
      },
      {
        name: '이벤트 응모 퍼널 [event_application_started → completed]',
        description:
          '이벤트 응모 페이지 진입 대비 제출 성공률이며 개인정보는 포함하지 않습니다.',
        query: funnel({
          series: [
            event('event_application_started', { label: '응모 시작' }),
            event('event_application_completed', {
              label: '응모 제출 성공',
              properties: [exact('outcome', 'success')],
            }),
          ],
        }),
      },
      {
        name: '사이트 방문 주간 리텐션 [$pageview]',
        previousNames: ['매장 발견 주간 리텐션 [store_discovery_succeeded]'],
        description:
          '처음 사이트를 방문한 사용자가 다음 주에도 다시 방문하는지 확인합니다. 향후 가챠 신상 알림 등 재방문 기능의 효과를 함께 측정합니다.',
        query: retention('$pageview'),
      },
    ],
  },
  {
    name: '[기능] 가치가챠 상세 사용',
    description:
      '핵심 KPI 이외의 기능 채택과 사용 경로를 보관하는 탐색용 대시보드입니다. 데이터는 계속 수집하되 운영 핵심 대시보드와 분리합니다.',
    pinned: false,
    tags: ['gachi-gacha', 'feature-adoption', 'managed-by-code'],
    insights: [
      {
        name: '주요 화면 이동 [navigation_selected.destination]',
        description:
          'navigation_selected를 destination 속성으로 나눈 주요 화면 이동 추이입니다.',
        query: trends({
          series: [event('navigation_selected')],
          breakdown: 'destination',
        }),
      },
      {
        name: '랜딩 투어 전환 [landing_tour_step_viewed → exited]',
        description:
          '첫 랜딩 단계 조회부터 마지막 단계 조회와 투어 완료까지의 전환입니다. 중간 이탈 단계와 SKIP·닫기 사용은 별도 이벤트 속성으로 확인합니다.',
        query: funnel({
          series: [
            event('landing_tour_step_viewed', {
              label: '첫 단계 조회',
              properties: [exact('step_number', 1)],
            }),
            event('landing_tour_step_viewed', {
              label: '마지막 단계 조회',
              properties: [exact('step_number', 4)],
            }),
            event('landing_tour_exited', {
              label: '투어 완료',
              properties: [exact('exit_type', 'completed')],
            }),
          ],
        }),
      },
      {
        name: '댓글 작성→채팅 선택 [trade_comment_submission_completed → trade_chat_started]',
        description:
          '댓글 등록 성공 후 같은 거래 상세 방문에서 채팅하기를 선택했는지 확인합니다. 두 번째 단계는 comment_context=submitted_this_session으로 제한합니다.',
        query: funnel({
          series: [
            event('trade_comment_submission_completed', {
              label: '댓글 등록 성공',
              properties: [exact('outcome', 'success')],
            }),
            event('trade_chat_started', {
              label: '댓글 작성 후 채팅 선택',
              properties: [exact('comment_context', 'submitted_this_session')],
            }),
          ],
        }),
      },
      {
        name: '댓글 작성자 유형 [trade_comment_submission_completed.author_type]',
        description:
          '성공한 댓글을 회원과 비회원으로 나눠 봅니다. 비회원 닉네임이나 IP 원문은 수집하지 않습니다.',
        query: trends({
          series: [
            event('trade_comment_submission_completed', {
              properties: [exact('outcome', 'success')],
            }),
          ],
          breakdown: 'author_type',
        }),
      },
      {
        name: '카테고리 탐색 퍼널 [category_selected → store_opened]',
        description:
          '카테고리 선택부터 가챠 선택, 보유 매장 발견, 매장 상세 진입까지의 전환입니다.',
        query: funnel({
          series: [
            event('category_selected', { label: '카테고리 선택' }),
            event('category_gacha_selected', { label: '카테고리 가챠 선택' }),
            event('store_discovery_succeeded', { label: '보유 매장 발견' }),
            event('store_opened', { label: '매장 상세 진입' }),
          ],
        }),
      },
      {
        name: '장소 검색 채택 퍼널 [place_search_opened → result_selected]',
        description:
          '장소 검색창을 연 뒤 검색 성공과 결과 선택까지 이어지는지 확인합니다.',
        query: funnel({
          series: [
            event('place_search_opened', { label: '장소 검색 열기' }),
            event('place_search_completed', {
              label: '장소 검색 성공',
              properties: [exact('outcome', 'success')],
            }),
            event('place_search_result_selected', { label: '장소 선택' }),
          ],
        }),
      },
      {
        name: '프로필 저장 퍼널 [profile_edit_started → profile_update_completed]',
        description: '프로필 수정창 진입 대비 최종 저장 성공률입니다.',
        query: funnel({
          series: [
            event('profile_edit_started', { label: '프로필 수정 시작' }),
            event('profile_update_completed', {
              label: '프로필 저장 성공',
              properties: [exact('outcome', 'success')],
            }),
          ],
        }),
      },
      {
        name: '거래 상세 사진 사용 [trade_detail_photo_selected]',
        description:
          '거래 상세 사진 확대 열기와 썸네일·좌우 버튼·스와이프로 사진을 전환한 횟수입니다.',
        query: trends({
          series: [
            event('trade_detail_photo_viewer_opened', {
              label: '사진 확대 열기',
            }),
            event('trade_detail_photo_selected', {
              label: '사진 전환',
            }),
          ],
        }),
      },
      {
        name: '프로필 사진 변경 퍼널 [profile_image_selection_completed → update]',
        description:
          '유효한 이미지 선택, 파일 업로드 성공, 최종 프로필 저장 성공까지의 전환입니다. 파일명과 이미지 URL은 수집하지 않습니다.',
        query: funnel({
          series: [
            event('profile_image_selection_completed', {
              label: '유효한 이미지 선택',
              properties: [exact('outcome', 'success')],
            }),
            event('profile_image_upload_completed', {
              label: '이미지 업로드 성공',
              properties: [exact('outcome', 'success')],
            }),
            event('profile_update_completed', {
              label: '프로필 저장 성공',
              properties: [
                exact('outcome', 'success'),
                exact('image_change', 'replaced'),
              ],
            }),
          ],
        }),
      },
      {
        name: '이벤트 완료글 증빙 사용 [has_completed_trade_evidence]',
        description:
          '응모 성공 이벤트를 완료 거래글 증빙 링크 포함 여부로 구분합니다. 링크 원문은 수집하지 않습니다.',
        query: trends({
          series: [
            event('event_application_completed', {
              properties: [exact('outcome', 'success')],
            }),
          ],
          breakdown: 'has_completed_trade_evidence',
        }),
      },
      {
        name: '업데이트 소식 사용 [updates_page_viewed → release_notes_selected]',
        description:
          '업데이트 소식 페이지 조회가 GitHub의 전체 변경 기록 확인으로 이어지는지 봅니다.',
        query: funnel({
          series: [
            event('updates_page_viewed', { label: '업데이트 소식 조회' }),
            event('release_notes_selected', {
              label: '전체 변경 기록 선택',
            }),
          ],
        }),
      },
      {
        name: '매장 상세 기능 사용 [store_opened 외 3종]',
        description:
          '매장 상세 진입, 사진 보기, 보유 가챠 로드, 가챠 더 보기의 사용량을 비교합니다.',
        query: trends({
          series: [
            event('store_opened', { label: '매장 상세 진입' }),
            event('store_photo_viewed', { label: '매장 사진 보기' }),
            event('store_catalog_load_completed', {
              label: '보유 가챠 로드 성공',
              properties: [exact('outcome', 'success')],
            }),
            event('store_catalog_more_requested', { label: '가챠 더 보기' }),
          ],
        }),
      },
      {
        name: '계정 메뉴 사용 [account_menu_selected.target]',
        description:
          '업데이트 소식, 개인정보처리방침, 고객센터, 로그아웃, 탈퇴 진입을 target별로 봅니다.',
        query: trends({
          series: [event('account_menu_selected')],
          breakdown: 'target',
        }),
      },
    ],
  },
  {
    name: '[품질] 가치가챠 실패·복구',
    description:
      'API 실패와 사용자의 재시도 행동을 배포 후 빠르게 확인하는 품질 대시보드입니다. 실제 오류 본문이나 개인정보는 수집하지 않습니다.',
    pinned: false,
    tags: ['gachi-gacha', 'quality', 'managed-by-code'],
    insights: [
      {
        name: '주요 처리 실패 추이 [outcome=failure]',
        description:
          '등록, 채팅, 프로필, 이벤트 응모 등 완료 이벤트의 outcome=failure 추이입니다.',
        query: trends({
          series: [
            event('trade_form_completed', {
              label: '교환글 저장 실패',
              properties: [exact('outcome', 'failure')],
            }),
            event('chat_room_entry_completed', {
              label: '채팅방 진입 실패',
              properties: [exact('outcome', 'failure')],
            }),
            event('chat_message_send_completed', {
              label: '메시지 전송 실패',
              properties: [exact('outcome', 'failure')],
            }),
            event('profile_update_completed', {
              label: '프로필 저장 실패',
              properties: [exact('outcome', 'failure')],
            }),
            event('event_application_completed', {
              label: '이벤트 응모 실패',
              properties: [exact('outcome', 'failure')],
            }),
            event('trade_comment_submission_completed', {
              label: '댓글 등록 실패',
              properties: [exact('outcome', 'failure')],
            }),
            event('mypage_trades_load_completed', {
              label: '마이페이지 교환글 조회 실패',
              properties: [exact('outcome', 'failure')],
            }),
          ],
        }),
      },
      {
        name: '조회·검색 실패 추이 [*_failed]',
        description: '가챠 검색 실패와 지도 매장 조회 실패의 추이입니다.',
        query: trends({
          series: [
            event('gacha_search_failed', { label: '가챠 검색 실패' }),
            event('store_results_failed', { label: '매장 조회 실패' }),
          ],
        }),
      },
      {
        name: '사용자 재시도 [recovery_action_selected.feature]',
        description:
          '오류 화면에서 다시 시도한 기능을 feature 속성별로 확인합니다.',
        query: trends({
          series: [event('recovery_action_selected')],
          breakdown: 'feature',
        }),
      },
      {
        name: '로그인 성공·실패 [oauth_login_completed.outcome]',
        description: 'OAuth 콜백 처리 결과를 outcome별로 확인합니다.',
        query: trends({
          series: [event('oauth_login_completed')],
          breakdown: 'outcome',
        }),
      },
      {
        name: '거래 상태 변경 결과 [trade_status_update_completed.outcome]',
        description:
          '채팅방 등에서 수행된 거래 상태 변경 성공·실패 추이입니다.',
        query: trends({
          series: [event('trade_status_update_completed')],
          breakdown: 'outcome',
        }),
      },
      {
        name: '프로필 이미지 실패 [profile_image_* outcome=failure]',
        description:
          '프로필 이미지 형식·크기 검증 거절과 업로드 실패를 구분합니다. 원본 파일 정보는 수집하지 않습니다.',
        query: trends({
          series: [
            event('profile_image_selection_completed', {
              label: '이미지 선택 거절',
              properties: [exact('outcome', 'failure')],
            }),
            event('profile_image_upload_completed', {
              label: '이미지 업로드 실패',
              properties: [exact('outcome', 'failure')],
            }),
          ],
        }),
      },
    ],
  },
];

async function api(path, options = {}) {
  const response = await fetch(`${HOST}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    ...(options.body ? { body: JSON.stringify(options.body) } : {}),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(
      `${options.method ?? 'GET'} ${path} 실패 (${response.status}): ${detail}`,
    );
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

async function listAll(resource) {
  const result = await api(
    `/api/projects/${PROJECT_ID}/${resource}/?limit=500&exclude_generated=true`,
  );
  return result.results ?? [];
}

async function upsertDashboard(definition, dashboards) {
  const existing = dashboards.find(
    (dashboard) => dashboard.name === definition.name && !dashboard.deleted,
  );
  const body = {
    name: definition.name,
    description: definition.description,
    pinned: definition.pinned,
    tags: definition.tags,
  };

  if (!APPLY_CHANGES) {
    console.log(
      `[dry-run] dashboard ${existing ? 'update' : 'create'}: ${definition.name}`,
    );
    return existing ?? { id: `dry-run:${definition.name}` };
  }

  if (existing) {
    const updated = await api(
      `/api/projects/${PROJECT_ID}/dashboards/${existing.id}/`,
      { method: 'PATCH', body },
    );
    console.log(`dashboard updated: ${definition.name} (#${updated.id})`);
    return updated;
  }

  const created = await api(`/api/projects/${PROJECT_ID}/dashboards/`, {
    method: 'POST',
    body,
  });
  dashboards.push(created);
  console.log(`dashboard created: ${definition.name} (#${created.id})`);
  return created;
}

async function upsertInsight(definition, dashboardId, insights) {
  const managedNames = [definition.name, ...(definition.previousNames ?? [])];
  const existing = insights.find(
    (insight) => managedNames.includes(insight.name) && !insight.deleted,
  );
  const existingDashboards = existing?.dashboards ?? [];
  const dashboards = [
    ...new Set([...existingDashboards, dashboardId].filter(Number.isInteger)),
  ];
  const body = {
    name: definition.name,
    description: definition.description,
    query: definition.query,
    dashboards,
  };

  if (!APPLY_CHANGES) {
    console.log(
      `[dry-run] insight ${existing ? 'update' : 'create'}: ${definition.name}`,
    );
    return;
  }

  if (existing) {
    const updated = await api(
      `/api/projects/${PROJECT_ID}/insights/${existing.id}/`,
      { method: 'PATCH', body },
    );
    console.log(`insight updated: ${definition.name} (#${updated.id})`);
    return;
  }

  const created = await api(`/api/projects/${PROJECT_ID}/insights/`, {
    method: 'POST',
    body,
  });
  insights.push(created);
  console.log(`insight created: ${definition.name} (#${created.id})`);
}

async function main() {
  const [dashboards, insights] = await Promise.all([
    listAll('dashboards'),
    listAll('insights'),
  ]);

  console.log(
    APPLY_CHANGES
      ? 'PostHog 대시보드 동기화를 시작합니다.'
      : '변경 없이 PostHog 대시보드 동기화 계획을 확인합니다.',
  );

  for (const dashboardDefinition of dashboardDefinitions) {
    const dashboard = await upsertDashboard(dashboardDefinition, dashboards);

    for (const insightDefinition of dashboardDefinition.insights) {
      await upsertInsight(insightDefinition, dashboard.id, insights);
    }
  }

  console.log(
    APPLY_CHANGES
      ? 'PostHog 대시보드 동기화가 완료되었습니다.'
      : '실제 반영하려면 --apply 옵션을 사용하세요.',
  );
}

await main();

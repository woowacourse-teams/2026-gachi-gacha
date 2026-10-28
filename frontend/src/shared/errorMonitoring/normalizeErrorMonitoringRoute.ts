const ROUTE_TEMPLATES: ReadonlyArray<{
  pattern: RegExp;
  template: string;
}> = [
  { pattern: /^\/trade\/new\/?$/, template: '/trade/new' },
  {
    pattern: /^\/trade\/[^/]+\/edit\/?$/,
    template: '/trade/:tradeId/edit',
  },
  { pattern: /^\/trade\/[^/]+\/?$/, template: '/trade/:tradeId' },
  { pattern: /^\/stores\/[^/]+\/?$/, template: '/stores/:storeId' },
  {
    pattern: /^\/chat\/start\/[^/]+\/?$/,
    template: '/chat/start/:tradeId',
  },
  { pattern: /^\/chat\/[^/]+\/?$/, template: '/chat/:roomId' },
  {
    pattern: /^\/oauth\/login\/[^/]+\/?$/,
    template: '/oauth/login/:provider',
  },
];

const OPAQUE_SEGMENT_PATTERN = /\/(?:\d+|[0-9a-f]{8}-[0-9a-f-]{27,})($|\/)/gi;

export function normalizeErrorMonitoringRoute(pathname: string): string {
  const normalizedPathname = pathname.startsWith('/') ? pathname : '/';
  const routeTemplate = ROUTE_TEMPLATES.find(({ pattern }) =>
    pattern.test(normalizedPathname),
  );

  if (routeTemplate) {
    return routeTemplate.template;
  }

  // 새 동적 라우트가 추가돼도 숫자·UUID가 태그로 그대로 전송되지 않게 한다.
  return normalizedPathname.replace(OPAQUE_SEGMENT_PATTERN, '/:id$1');
}

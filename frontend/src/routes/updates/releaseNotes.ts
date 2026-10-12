export interface ServiceReleaseNote {
  version: string;
  releasedAt: string;
  releasedAtLabel: string;
  title: string;
  summary: string;
  highlights: readonly string[];
  releaseUrl: string;
}

export const SERVICE_RELEASE_NOTES = [
  {
    version: 'v1.2.0',
    releasedAt: '2026-10-10',
    releasedAtLabel: '2026년 10월 10일',
    title: '더 안정적인 화면 이동과 이벤트 응모',
    summary:
      '주요 화면을 오갈 때 헤더가 흔들리던 문제를 줄이고 이벤트 참여 정보를 더 정확하게 받을 수 있도록 개선했어요.',
    highlights: [
      '거래/교환·지도·검색 탭을 오갈 때 헤더 위치와 간격을 안정화했어요.',
      '모바일 지도 검색창과 헤더 여백을 더 자연스럽게 다듬었어요.',
      '이벤트 응모 시 실제 거래 완료글을 별도로 제출할 수 있게 했어요.',
    ],
    releaseUrl:
      'https://github.com/woowacourse-teams/2026-gachi-gacha/releases/tag/v1.2.0',
  },
  {
    version: 'v1.1.0',
    releasedAt: '2026-10-09',
    releasedAtLabel: '2026년 10월 9일',
    title: '탐색부터 거래까지 더 편리하게',
    summary:
      '가치가챠의 주요 동선을 거래 중심으로 정리하고 지도·검색·마이페이지 경험과 첫 이벤트를 준비했어요.',
    highlights: [
      '거래/교환 목록을 서비스의 첫 화면으로 바꾸고 헤더 동선을 정리했어요.',
      '지도 첫 진입 시 홍대 가챠 매장을 보여주고 지원 지역을 안내해요.',
      '모바일 카테고리 탐색, 거래 카드, 프로필 거래 지역 설정을 개선했어요.',
      '로그인 회원용 굿즈 추첨 이벤트 응모 페이지를 추가했어요.',
    ],
    releaseUrl:
      'https://github.com/woowacourse-teams/2026-gachi-gacha/releases/tag/v1.1.0',
  },
  {
    version: 'v1.0.0',
    releasedAt: '2026-10-02',
    releasedAtLabel: '2026년 10월 2일',
    title: '가치가챠의 첫 운영 공개',
    summary:
      '가챠 상품과 판매 매장을 찾고, 사용자끼리 원하는 상품을 거래할 수 있는 가치가챠를 처음 공개했어요.',
    highlights: [
      '카테고리·가챠 검색과 보유 매장 지도 탐색을 제공해요.',
      '거래글 등록·수정·삭제와 실시간 채팅을 지원해요.',
      '카카오·네이버 로그인과 마이페이지에서 내 활동을 확인할 수 있어요.',
    ],
    releaseUrl:
      'https://github.com/woowacourse-teams/2026-gachi-gacha/releases/tag/v1.0.0',
  },
] as const satisfies readonly ServiceReleaseNote[];

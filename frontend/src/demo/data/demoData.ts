import pokemonDiorama from '../assets/pokemon-diorama.jpg';
import pokemonLight from '../assets/pokemon-light.jpg';
import sanrioBaby from '../assets/sanrio-baby.jpg';
import sanrioCaseTwo from '../assets/sanrio-case-two.jpg';
import sanrioCase from '../assets/sanrio-case.jpg';
import sanrioClock from '../assets/sanrio-clock.jpg';
import sanrioKeychain from '../assets/sanrio-keychain.jpg';
import sanrioLight from '../assets/sanrio-light.jpg';
import sanrioMini from '../assets/sanrio-mini.jpg';
import sanrioNote from '../assets/sanrio-note.jpg';
import sanrioPenlight from '../assets/sanrio-penlight.jpg';
import sanrioPlush from '../assets/sanrio-plush.jpg';
import sanrioPouch from '../assets/sanrio-pouch.jpg';
import sanrioStand from '../assets/sanrio-stand.jpg';
import storeGoods from '../assets/store-goods.webp';
import storeInterior from '../assets/store-interior.webp';
import storeMachinesTwo from '../assets/store-machines-two.webp';
import storeMachines from '../assets/store-machines.webp';
import storeMowajul from '../assets/store-mowajul.webp';
import storeOcean from '../assets/store-ocean.webp';
import type { DemoListing, DemoProduct, DemoStore } from '../demoType';

// 사진과 상품명은 공개 프로젝트 데이터의 정적 표본이다.
// 가격, 보유 매장, 영업 상태, 교환 게시글은 UX 체험용 예시이며 실제 재고가 아니다.
export const demoProducts: readonly DemoProduct[] = [
  {
    id: 3533,
    name: '산리오 캐릭터즈 은은한 발광 마스코트 라이트',
    image: sanrioLight,
    categories: ['산리오', '쿠로미', '마이멜로디', '라이트'],
    samplePrice: 4500,
    sampleStoreIds: [1, 2, 3],
  },
  {
    id: 3453,
    name: '산리오 캐릭터즈 미니 파우치 키체인',
    image: sanrioKeychain,
    categories: ['산리오', '시나모롤', '폼폼푸린', '키링'],
    samplePrice: 4000,
    sampleStoreIds: [1, 2],
  },
  {
    id: 3374,
    name: '산리오 캐릭터즈 야채 베이비 마스코트',
    image: sanrioBaby,
    categories: ['산리오', '쿠로미', '시나모롤', '키링'],
    samplePrice: 5000,
    sampleStoreIds: [2, 3],
  },
  {
    id: 3482,
    name: '산리오 캐릭터즈 링링 방울 봉제인형',
    image: sanrioPlush,
    categories: ['산리오', '헬로키티', '폼폼푸린', '봉제인형'],
    samplePrice: 6000,
    sampleStoreIds: [1, 3],
  },
  {
    id: 3493,
    name: '산리오 캐릭터즈 미니미니 모래놀이 세트',
    image: sanrioMini,
    categories: ['산리오', '쿠로미', '마이멜로디', '미니어처'],
    samplePrice: 4500,
    sampleStoreIds: [1, 2],
  },
  {
    id: 3454,
    name: '산리오 캐릭터즈 아크릴 최애 펜라이트',
    image: sanrioPenlight,
    categories: ['산리오', '시나모롤', '한교동', '라이트'],
    samplePrice: 4000,
    sampleStoreIds: [2, 3],
  },
  {
    id: 3733,
    name: '산리오 캐릭터즈 푸푸 포쉐트',
    image: sanrioPouch,
    categories: ['산리오', '파우치'],
    samplePrice: 6000,
    sampleStoreIds: [1],
  },
  {
    id: 3324,
    name: '산리오 캐릭터즈 탭&스탠드 2way 아크릴',
    image: sanrioStand,
    categories: ['산리오', '아크릴', '피규어'],
    samplePrice: 5000,
    sampleStoreIds: [1, 3],
  },
  {
    id: 3308,
    name: '산리오 캐릭터즈 레트로 시계풍 클립 키링',
    image: sanrioClock,
    categories: ['산리오', '키링', '클립'],
    samplePrice: 4000,
    sampleStoreIds: [2],
  },
  {
    id: 3307,
    name: '산리오 캐릭터즈 크레용 케이스 Part 2',
    image: sanrioCase,
    categories: ['산리오', '케이스', '미니어처'],
    samplePrice: 5000,
    sampleStoreIds: [1, 2],
  },
  {
    id: 3306,
    name: '산리오 캐릭터즈 크레용 케이스 Part 1',
    image: sanrioCaseTwo,
    categories: ['산리오', '케이스', '미니어처'],
    samplePrice: 5000,
    sampleStoreIds: [2, 3],
  },
  {
    id: 3305,
    name: '산리오 캐릭터즈 미니 공방 노트 참',
    image: sanrioNote,
    categories: ['산리오', '노트', '키링'],
    samplePrice: 4000,
    sampleStoreIds: [3],
  },
  {
    id: 3732,
    name: '포켓몬 지오라마 컬렉터 골드&전기',
    image: pokemonDiorama,
    categories: ['포켓몬', '피카츄', '피규어', '게임'],
    samplePrice: 6000,
    sampleStoreIds: [1, 2],
  },
  {
    id: 2636,
    name: '포켓몬스터 라이트브레스 2',
    image: pokemonLight,
    categories: ['포켓몬', '피카츄', '팬텀', '팔찌', '게임'],
    samplePrice: 4000,
    sampleStoreIds: [2, 3],
  },
];

// 기존 S3의 공개 매장 사진을 브라우저 호환 WebP로 변환한 체험용 표본.
// 아래 상호와 사진의 조합은 실제 매장 정보가 아니다.
export const demoStores: readonly DemoStore[] = [
  {
    id: 1,
    name: '홍대 캡슐 스테이션',
    address: '홍대입구역 3번 출구 근처 · 예시 매장',
    image: storeMachines,
    gallery: [
      storeMachines,
      storeMachinesTwo,
      storeGoods,
      storeMowajul,
      sanrioPlush,
    ],
    sampleDistance: '850m',
    sampleMachineCount: 128,
    samplePriceRange: '₩3,000 ~ ₩6,000',
    sampleOpen: true,
    pin: { x: 36, y: 43 },
  },
  {
    id: 2,
    name: '연남 토이 아지트',
    address: '연트럴파크 근처 · 예시 매장',
    image: storeOcean,
    gallery: [
      storeOcean,
      storeMowajul,
      storeInterior,
      sanrioBaby,
      pokemonLight,
    ],
    sampleDistance: '1.2km',
    sampleMachineCount: 64,
    samplePriceRange: '₩4,000 ~ ₩8,000',
    sampleOpen: true,
    pin: { x: 68, y: 24 },
  },
  {
    id: 3,
    name: '합정 가챠 라운지',
    address: '합정역 7번 출구 근처 · 예시 매장',
    image: storeGoods,
    gallery: [
      storeGoods,
      storeMachinesTwo,
      storeOcean,
      pokemonDiorama,
      sanrioKeychain,
    ],
    sampleDistance: '1.8km',
    sampleMachineCount: 92,
    samplePriceRange: '₩3,000 ~ ₩5,500',
    sampleOpen: false,
    pin: { x: 48, y: 76 },
  },
];

export const demoListings: readonly DemoListing[] = [
  {
    id: 1,
    productId: 3374,
    title: '쿠로미 야채 베이비 마스코트 교환해요',
    neighborhood: '홍대입구역 8번 출구',
    samplePrice: 5000,
    sampleTime: '오늘 19:30',
  },
  {
    id: 2,
    productId: 3453,
    title: '시나모롤 미니 파우치 키체인',
    neighborhood: '연트럴파크 입구',
    samplePrice: 4000,
    sampleTime: '오늘 20:00',
  },
  {
    id: 3,
    productId: 3732,
    title: '포켓몬 지오라마 피규어',
    neighborhood: '합정 메세나폴리스',
    samplePrice: 6000,
    sampleTime: '내일 12:30',
  },
  {
    id: 4,
    productId: 3482,
    title: '폼폼푸린 방울 봉제인형',
    neighborhood: '홍대입구역 3번 출구',
    samplePrice: 6000,
    sampleTime: '오늘 18:40',
  },
];

export function formatSamplePrice(price: number): string {
  return '₩' + price.toLocaleString('ko-KR');
}

function normalizeKeyword(value: string): string {
  return value.normalize('NFKC').toLocaleLowerCase('ko-KR').replace(/\s+/g, '');
}

export function searchDemoProducts(keyword: string): readonly DemoProduct[] {
  const normalized = normalizeKeyword(keyword);
  if (!normalized) return [];
  return demoProducts.filter((product) =>
    [product.name, ...product.categories].some((value) =>
      normalizeKeyword(value).includes(normalized),
    ),
  );
}

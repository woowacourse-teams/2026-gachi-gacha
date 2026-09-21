/**
 * 건물의 층 목록과 층별 도면.
 *
 * 지금은 층마다 그림이 없다. 자리만 잡아 두고, 도면 이미지가 들어오면
 * `plateSrc` 를 채운다. 그때까지는 사진에서 뽑아 둔 윤곽선으로 판을 그린다.
 */

/**
 * 층 도면 판의 바깥 윤곽.
 *
 * 9층 안내판 사진에서 굵은 남색 외곽선을 따 폴리곤 28개 점으로 줄인 것이다.
 * 가로 1000 기준이고 세로는 985 다.
 *
 * 임시 그림이다. 층마다 실제 도면이 들어오면 이 상수는 지운다. 지금은 층이
 * 전부 같은 모양으로 보이는데, 실제로는 층마다 다르다.
 */
export const FLOOR_OUTLINE_PATH =
  'M 152.3 985.3 L 95.7 981.9 L 52.7 961.5 L 26.0 925.8 L 14.7 881.7 L 14.7 845.4 L 23.8 814.8 L 63.4 771.8 L 60.0 588.3 L 11.9 584.4 L 9.1 552.1 L 0.0 178.4 L 45.3 175.0 L 40.8 5.1 L 941.7 0.0 L 946.8 169.3 L 995.5 172.7 L 1000.0 570.2 L 864.7 574.2 L 849.4 657.4 L 810.9 743.5 L 763.3 806.9 L 718.6 852.8 L 651.8 899.2 L 544.2 938.8 L 231.6 951.3 L 187.4 977.3 L 152.3 985.3 Z';

export const FLOOR_OUTLINE_SIZE = { width: 1000, height: 985 } as const;

export interface BuildingFloor {
  /** 층수. 1 부터. */
  floor: number;
  /**
   * 이 층 도면 그림. 아직 없으면 `null` 이고, 그때는 윤곽선만으로 그린다.
   * 층마다 배치가 다르므로 한 장을 돌려 쓰지 않는다.
   */
  plateSrc: string | null;
  /**
   * 이 층의 가챠샵 수.
   *
   * 서버가 층별 개수를 주지 않아서 아직 채울 수 없다. `null` 이면 아래 요약
   * 줄에서 개수를 숨긴다. 0 으로 두면 '가챠샵 0개'라고 거짓말을 하게 된다.
   */
  shopCount: number | null;
}

/** 국제전자센터는 1층부터 9층까지다. */
export const GUKJE_ELECTRONICS_CENTER_FLOORS: readonly BuildingFloor[] =
  Array.from({ length: 9 }, (_, index) => ({
    floor: index + 1,
    plateSrc: null,
    shopCount: null,
  }));

/** 화면에 처음 보여 줄 층. 시안이 6층을 고른 상태로 그려져 있다. */
export const DEFAULT_SELECTED_FLOOR = 6;

import assert from 'node:assert/strict';
import test from 'node:test';

import { parseKakaoPlaceSearchResponse } from '../src/domains/place/kakaoPlaceSearchParser.ts';

test('카카오 장소 검색 응답을 웹과 같은 장소 선택 값으로 변환한다', () => {
  assert.deepEqual(
    parseKakaoPlaceSearchResponse({
      documents: [
        {
          address_name: '서울 마포구 동교동 165',
          id: '1',
          place_name: '홍대입구역 2호선',
          road_address_name: '서울 마포구 양화로 160',
          x: '126.923778562273',
          y: '37.5568703701854',
        },
      ],
    }),
    [
      {
        address: '서울 마포구 양화로 160',
        id: '1',
        latitude: 37.5568703701854,
        longitude: 126.923778562273,
        name: '홍대입구역 2호선',
      },
    ],
  );
});

test('도로명 주소가 없으면 지번 주소를 사용하고 유효하지 않은 결과는 제외한다', () => {
  assert.deepEqual(
    parseKakaoPlaceSearchResponse({
      documents: [
        {
          address_name: '서울 마포구 동교동 165',
          id: '2',
          place_name: '홍대입구역',
          road_address_name: '',
          x: '126.92',
          y: '37.55',
        },
        {
          address_name: '해외 주소',
          id: '3',
          place_name: '대한민국 범위 밖',
          x: '10',
          y: '10',
        },
      ],
    }),
    [
      {
        address: '서울 마포구 동교동 165',
        id: '2',
        latitude: 37.55,
        longitude: 126.92,
        name: '홍대입구역',
      },
    ],
  );
});

test('documents가 없는 응답은 안전하게 거부한다', () => {
  assert.throws(
    () => parseKakaoPlaceSearchResponse({}),
    /응답 형식이 올바르지 않습니다/,
  );
});

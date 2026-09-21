import { useEffect, useRef } from 'react';

import { useMap } from '@/components/kakaoMap/KakaoMapContext';

import { getBuildingMarkerScale } from '../model/buildingMarkerScale';
import type { BuildingMarkerArt, GachaBuilding } from '../model/gachaBuilding';

/**
 * 건물 마커는 매장 마커보다 위에 그린다.
 *
 * 건물 좌표 근처에는 건물에 속하지 않은 매장 마커가 있을 수 있다. 건물이
 * 밑에 깔리면 70곳을 대표하는 마커가 매장 하나에 가려진다.
 */
const BUILDING_Z_INDEX = 20;

/**
 * 배율만큼 줄인 그림을 만든다.
 *
 * 기준점과 클릭 영역도 같이 줄여야 한다. 크기만 줄이면 마커가 좌표에서
 * 밀려나고, 누르는 자리가 그림 밖으로 나간다.
 */
function createMarkerImage(art: BuildingMarkerArt, scale: number) {
  const { maps } = window.kakao;
  const [left, top, right, bottom] = art.hitCoords
    .split(',')
    .map((value) => Math.round(Number(value) * scale));

  return new maps.MarkerImage(
    art.src,
    new maps.Size(art.width * scale, art.height * scale),
    {
      offset: new maps.Point(art.anchorX * scale, art.anchorY * scale),
      shape: 'rect',
      coords: `${left},${top},${right},${bottom}`,
    },
  );
}

interface BuildingMarkerProps {
  building: GachaBuilding;
  onClick?: () => void;
}

export default function BuildingMarker({
  building,
  onClick,
}: BuildingMarkerProps) {
  const map = useMap();
  const onClickRef = useRef(onClick);

  useEffect(() => {
    onClickRef.current = onClick;
  });

  useEffect(() => {
    const { maps } = window.kakao;
    const { latitude, longitude, marker: art, name } = building;

    const marker = new maps.Marker({
      map,
      position: new maps.LatLng(latitude, longitude),
      image: createMarkerImage(art, getBuildingMarkerScale(map.getLevel())),
      title: name,
      zIndex: BUILDING_Z_INDEX,
      clickable: true,
    });

    const handleClick = () => onClickRef.current?.();
    // 지도를 넓히거나 좁힐 때마다 그림을 다시 만든다.
    const handleZoomChanged = () => {
      marker.setImage(
        createMarkerImage(art, getBuildingMarkerScale(map.getLevel())),
      );
    };

    maps.event.addListener(marker, 'click', handleClick);
    maps.event.addListener(map, 'zoom_changed', handleZoomChanged);

    return () => {
      maps.event.removeListener(marker, 'click', handleClick);
      maps.event.removeListener(map, 'zoom_changed', handleZoomChanged);
      marker.setMap(null);
    };
  }, [map, building]);

  return null;
}

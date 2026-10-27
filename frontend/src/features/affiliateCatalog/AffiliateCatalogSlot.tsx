import { useEffect, useState } from 'react';
import type { ComponentType } from 'react';

export interface AffiliateCatalogCategorySlotProps {
  matchBy: 'category';
  categoryName: string;
  placementPath: string;
}

export interface AffiliateCatalogContentSlotProps {
  matchBy: 'content';
  categoryNames: readonly string[];
  placementPath: string;
  title?: string;
}

export type AffiliateCatalogSlotProps =
  AffiliateCatalogCategorySlotProps | AffiliateCatalogContentSlotProps;

type AffiliateCatalogRuntimeComponent =
  ComponentType<AffiliateCatalogSlotProps>;

let loadedRuntime: AffiliateCatalogRuntimeComponent | null = null;
let runtimeRequest: Promise<AffiliateCatalogRuntimeComponent> | null = null;

function loadAffiliateCatalogRuntime() {
  runtimeRequest ??= import('./AffiliateCatalogRuntime').then(
    ({ AffiliateCatalogRuntime }) => {
      loadedRuntime = AffiliateCatalogRuntime;

      return AffiliateCatalogRuntime;
    },
  );

  return runtimeRequest;
}

/**
 * 기존 화면과 선택형 제휴 기능 사이의 유일한 연결 지점입니다.
 *
 * 기능이 꺼져 있으면 제휴 구현과 생성 카탈로그를 요청하지 않습니다. 로딩에
 * 실패해도 핵심 화면에는 영향을 주지 않고 슬롯만 비워 둡니다.
 */
export function AffiliateCatalogSlot(props: AffiliateCatalogSlotProps) {
  const [Runtime, setRuntime] =
    useState<AffiliateCatalogRuntimeComponent | null>(loadedRuntime);

  useEffect(() => {
    if (!__AFFILIATE_CATALOG_ENABLED__ || Runtime) return;

    let isMounted = true;

    void loadAffiliateCatalogRuntime()
      .then((runtime) => {
        if (isMounted) setRuntime(() => runtime);
      })
      .catch(() => {
        // 선택 기능의 청크가 실패해도 기존 페이지는 그대로 사용할 수 있어야 한다.
      });

    return () => {
      isMounted = false;
    };
  }, [Runtime]);

  if (!__AFFILIATE_CATALOG_ENABLED__ || !Runtime) return null;

  return <Runtime {...props} />;
}

package com.gachigacha.kakaomap

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class GachiKakaoMapModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("GachiKakaoMap")

    View(GachiKakaoMapView::class) {
      Events("onCameraMoveEnd", "onMapError", "onMapReady", "onMarkerPress")

      Prop("active") { view: GachiKakaoMapView, active: Boolean ->
        view.setActive(active)
      }

      Prop("center") { view: GachiKakaoMapView, center: KakaoMapCoordinateRecord ->
        view.setCenter(center)
      }

      Prop("markers") { view: GachiKakaoMapView, markers: List<KakaoMapMarkerRecord> ->
        view.setMarkers(markers)
      }

      Prop("recenterRequestId") { view: GachiKakaoMapView, requestId: Int ->
        view.setRecenterRequestId(requestId)
      }

      Prop("showsUserLocation") { view: GachiKakaoMapView, showsUserLocation: Boolean ->
        view.setShowsUserLocation(showsUserLocation)
      }
    }
  }
}

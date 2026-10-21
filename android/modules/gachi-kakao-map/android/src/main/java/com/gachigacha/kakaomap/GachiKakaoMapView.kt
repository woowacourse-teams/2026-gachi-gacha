package com.gachigacha.kakaomap

import android.content.Context
import android.content.pm.PackageManager
import android.view.View
import com.kakao.vectormap.KakaoMap
import com.kakao.vectormap.KakaoMapReadyCallback
import com.kakao.vectormap.KakaoMapSdk
import com.kakao.vectormap.LatLng
import com.kakao.vectormap.MapLifeCycleCallback
import com.kakao.vectormap.MapView
import com.kakao.vectormap.camera.CameraUpdateFactory
import com.kakao.vectormap.label.LabelOptions
import com.kakao.vectormap.label.LabelStyle
import com.kakao.vectormap.label.LabelStyles
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoView

class GachiKakaoMapView(context: Context, appContext: AppContext) : ExpoView(context, appContext) {
  private val onMapError by EventDispatcher<Map<String, String>>()
  private val onMapReady by EventDispatcher<Unit>()
  private val onMarkerPress by EventDispatcher<Map<String, Double>>()

  private var active = true
  private var center = Coordinate(DEFAULT_LATITUDE, DEFAULT_LONGITUDE)
  private var kakaoMap: KakaoMap? = null
  private var mapView: MapView? = null
  private var markers: List<Marker> = emptyList()
  private var showsUserLocation = false
  private var started = false
  private var storeMarkerStyle: LabelStyles? = null
  private var userLocationStyle: LabelStyles? = null

  fun setActive(value: Boolean) {
    active = value
    updateMapLifecycle()
  }

  fun setCenter(value: KakaoMapCoordinateRecord) {
    if (!value.latitude.isValidLatitude() || !value.longitude.isValidLongitude()) return
    center = Coordinate(value.latitude, value.longitude)
    updateCamera()
    renderMarkers()
  }

  fun setMarkers(value: List<KakaoMapMarkerRecord>) {
    markers = value.mapNotNull { marker ->
      if (!marker.latitude.isValidLatitude() || !marker.longitude.isValidLongitude()) {
        null
      } else {
        Marker(marker.id, marker.latitude, marker.longitude)
      }
    }
    renderMarkers()
  }

  fun setShowsUserLocation(value: Boolean) {
    showsUserLocation = value
    renderMarkers()
  }

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    startMapIfNeeded()
    updateMapLifecycle()
  }

  override fun onDetachedFromWindow() {
    if (started) {
      mapView?.pause()
      mapView?.finish()
    }
    mapView?.let(::removeView)
    mapView = null
    started = false
    kakaoMap = null
    storeMarkerStyle = null
    userLocationStyle = null
    super.onDetachedFromWindow()
  }

  override fun onWindowVisibilityChanged(visibility: Int) {
    super.onWindowVisibilityChanged(visibility)
    updateMapLifecycle()
  }

  private fun startMapIfNeeded() {
    if (started) return

    try {
      val nativeAppKey = readNativeAppKey()
      if (nativeAppKey.isNullOrBlank()) {
        onMapError(mapOf("message" to "카카오 지도 설정을 확인해 주세요."))
        return
      }

      // KakaoMapSdk must be initialized before MapView is constructed.
      initializeSdk(context.applicationContext, nativeAppKey)
      val currentMapView = MapView(context).apply {
        layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT)
      }
      mapView = currentMapView
      addView(currentMapView)
      started = true
      currentMapView.start(
        object : MapLifeCycleCallback() {
          override fun onMapDestroy() {
            kakaoMap = null
          }

          override fun onMapError(error: Exception) {
            onMapError(mapOf("message" to "카카오 지도를 불러오지 못했어요."))
          }
        },
        object : KakaoMapReadyCallback() {
          override fun onMapReady(map: KakaoMap) {
            kakaoMap = map
            map.setOnLabelClickListener { _, _, label ->
              val markerId = (label.tag as? Number)?.toDouble()
              if (markerId != null) {
                onMarkerPress(mapOf("id" to markerId))
              }
            }
            updateCamera()
            renderMarkers()
            onMapReady(Unit)
          }

          override fun getPosition(): LatLng = LatLng.from(center.latitude, center.longitude)

          override fun getZoomLevel(): Int = DEFAULT_ZOOM_LEVEL
        },
      )
    } catch (_: Exception) {
      mapView?.let(::removeView)
      mapView = null
      started = false
      onMapError(mapOf("message" to "카카오 지도를 시작하지 못했어요."))
    }
  }

  private fun updateMapLifecycle() {
    if (!started) return

    if (active && isAttachedToWindow && windowVisibility == View.VISIBLE) {
      mapView?.resume()
    } else {
      mapView?.pause()
    }
  }

  private fun updateCamera() {
    kakaoMap?.moveCamera(
      CameraUpdateFactory.newCenterPosition(
        LatLng.from(center.latitude, center.longitude),
        DEFAULT_ZOOM_LEVEL,
      ),
    )
  }

  private fun renderMarkers() {
    val map = kakaoMap ?: return
    val layer = map.labelManager.layer
    layer.removeAll()

    val markerStyle = storeMarkerStyle ?: map.labelManager
      .addLabelStyles(
        LabelStyles.from(
          STORE_MARKER_STYLE_ID,
          LabelStyle.from(CapsuleMarkerBitmapFactory.storeMarker(context))
            .setApplyDpScale(false)
            .setAnchorPoint(0.5f, 1f),
        ),
      )
      .also { storeMarkerStyle = it }

    markers.forEach { marker ->
      layer.addLabel(
        LabelOptions.from(
          "store-${marker.id.toLong()}",
          LatLng.from(marker.latitude, marker.longitude),
        )
          .setStyles(markerStyle)
          .setClickable(true)
          .setTag(marker.id),
      )
    }

    if (showsUserLocation) {
      val currentLocationStyle = userLocationStyle ?: map.labelManager
        .addLabelStyles(
          LabelStyles.from(
            USER_LOCATION_STYLE_ID,
            LabelStyle.from(CapsuleMarkerBitmapFactory.userLocationMarker(context))
              .setApplyDpScale(false)
              .setAnchorPoint(0.5f, 0.5f),
          ),
        )
        .also { userLocationStyle = it }

      layer.addLabel(
        LabelOptions.from(
          USER_LOCATION_LABEL_ID,
          LatLng.from(center.latitude, center.longitude),
        )
          .setStyles(currentLocationStyle)
          .setClickable(false),
      )
    }
  }

  @Suppress("DEPRECATION")
  private fun readNativeAppKey(): String? {
    val applicationInfo = context.packageManager.getApplicationInfo(
      context.packageName,
      PackageManager.GET_META_DATA,
    )
    return applicationInfo.metaData?.getString(KAKAO_MAP_KEY_METADATA_NAME)
  }

  private data class Coordinate(val latitude: Double, val longitude: Double)

  private data class Marker(
    val id: Double,
    val latitude: Double,
    val longitude: Double,
  )

  companion object {
    private const val KAKAO_MAP_KEY_METADATA_NAME =
      "com.gachigacha.android.KAKAO_MAP_NATIVE_APP_KEY"
    private const val DEFAULT_LATITUDE = 37.5563
    private const val DEFAULT_LONGITUDE = 126.9236
    private const val DEFAULT_ZOOM_LEVEL = 14
    private const val STORE_MARKER_STYLE_ID = "gachi-store-marker"
    private const val USER_LOCATION_STYLE_ID = "gachi-user-location-marker"
    private const val USER_LOCATION_LABEL_ID = "current-user-location"

    @Volatile
    private var sdkInitialized = false

    @Synchronized
    private fun initializeSdk(context: Context, nativeAppKey: String) {
      if (sdkInitialized) return
      KakaoMapSdk.init(context, nativeAppKey)
      sdkInitialized = true
    }

    private fun Double.isValidLatitude() = isFinite() && this in -90.0..90.0

    private fun Double.isValidLongitude() = isFinite() && this in -180.0..180.0
  }
}

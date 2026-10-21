package com.gachigacha.kakaomap

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

class KakaoMapCoordinateRecord : Record {
  @Field
  var latitude: Double = 0.0

  @Field
  var longitude: Double = 0.0
}

class KakaoMapMarkerRecord : Record {
  @Field
  var id: Double = 0.0

  @Field
  var latitude: Double = 0.0

  @Field
  var longitude: Double = 0.0
}

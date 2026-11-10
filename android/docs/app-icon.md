# Android 앱 아이콘

2026-11-10에 제공받은 iOS 앱 아이콘 PNG를 Android와 Google Play에도 사용한다.
원본의 로고 형태·비율·색상은 변경하지 않는다.

| 파일 | 용도 | 변환 |
| --- | --- | --- |
| `assets/app-icon.png` | 일반 런처 및 원본 보관 | 제공된 1024×1024 RGB PNG 그대로 |
| `assets/app-icon-adaptive.png` | Android adaptive foreground | 원본 전체를 736×736으로 축소하고 1024×1024 흰 캔버스 중앙에 배치 |
| `assets/play-store-icon.png` | Play Console 기본 스토어 등록정보 | 원본 전체를 512×512 RGBA PNG로 축소 |

원본 SHA-256: `2a5a7e73f1a3804e560a4f07fcd7d1683d7acb4347e1e7bbc4ca1418b0142201`.
변환은 bicubic 리사이즈이며, 생성된 PNG에는 sRGB 청크를 포함한다.
모서리·그림자·문구는 추가하지 않는다.

Adaptive background는 `#FFFFFF`이다. 108dp 레이어의 중앙 지름 66dp 안전영역
안에 로고가 들어가도록 사방 144px의 추가 여백을 둔다. 제조사 마스크와 테마 아이콘
설정에 따라 최종 표시 형태·색상은 달라질 수 있다.

`npm run config:check`는 DEV/PROD 아이콘 경로, 배경색, PNG 크기·색상 형식,
스토어 아이콘의 1,024KB 제한을 검증한다. 기존 스플래시·알림 아이콘 설정은 변경하지 않는다.

운영 빌드는 기존 `Android Play Release` workflow의 `version_name=1.0.0`,
`version_code=5` 입력으로 준비한다. 마지막 확인된 Play 버전 코드는 4이며, 별도 수동
업로드 이력은 Console에서 확인해야 한다. 스토어용 PNG는 AAB와 별도로 Console에 등록한다.
앱 버전은 workflow 입력으로 결정되므로 `package.json` 버전은 변경하지 않는다.

공식 규격:

- [Google Play 아이콘](https://developer.android.com/distribute/google-play/resources/icon-design-specifications)
- [Android adaptive icon](https://developer.android.com/develop/ui/compose/system/icon_design_adaptive)

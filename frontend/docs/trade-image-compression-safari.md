# Safari 이미지 압축 실패 조사와 PNG 전환

## 문제 상황

교환 글 등록 시 이미지를 최대 800px, 1MB로 줄이고 WebP로 변환하도록 구현했다. Chrome에서는 같은 이미지가 정상적으로 등록됐지만 Safari에서는 다음 메시지가 표시되며 등록되지 않았다.

> 이미지를 최적화하지 못했습니다. 다시 시도해주세요.

처음에는 이미지 압축을 Web Worker에서 실행하고 있었기 때문에 Safari의 Worker 또는 `OffscreenCanvas` 호환 문제를 의심했다.

## 조사 과정

### 1. Chrome과 Safari 비교

동일한 JPEG 파일을 사용해 로컬 개발 서버에서 확인했다.

- Chrome: WebP 압축 및 모의 등록 성공
- Safari: WebP 압축 단계에서 실패

### 2. 원본 오류 확인

압축 함수가 내부 오류를 공통 사용자 메시지로 감싸고 있어 개발 환경에서 파일의 MIME 타입과 크기, 원본 오류를 콘솔에 기록하도록 진단 정보를 추가했다. 파일명이나 이미지 내용은 기록하지 않는다.

Safari에서 확인한 원본 오류는 다음과 같았다.

```text
이 브라우저에서는 WebP 변환을 지원하지 않습니다.
```

### 3. Worker 가설 검증

`useWebWorker`를 `false`로 변경하고 Worker 전용 `libURL`을 제거한 뒤 일반 Canvas 경로에서 다시 압축했다. 그러나 Safari에서는 같은 오류가 재현됐다. 따라서 Worker 자체가 직접적인 원인은 아니었다.

### 4. Safari Canvas 출력 확인

Safari 콘솔에서 Canvas의 실제 출력 형식을 확인했다.

```js
document.createElement('canvas').toDataURL('image/webp').slice(0, 30);
```

결과는 WebP가 아닌 PNG였다.

```text
data:image/png;base64,iVBORw0K
```

Safari는 WebP 이미지를 표시할 수 있지만, 확인한 실행 환경에서는 Canvas를 통한 WebP 인코딩을 지원하지 않았다. `browser-image-compression`은 Canvas의 인코딩 기능을 사용하므로 `image/webp`를 요청해도 PNG Blob이 생성됐고, 애플리케이션의 MIME 검증에서 실패했다.

## 최종 선택

프론트엔드에서 별도의 WASM 인코더를 추가하지 않고 모든 대상 브라우저에서 동일하게 동작하도록 출력 형식을 PNG로 변경했다.

```ts
const compressedBlob = await imageCompression(file, {
  fileType: 'image/png',
  initialQuality: 0.8,
  maxSizeMB: 1,
  maxWidthOrHeight: 800,
  preserveExif: false,
  useWebWorker: false,
});
```

결과 파일의 확장자와 MIME 타입도 `.png`, `image/png`로 통일했다. 더 이상 사용하지 않는 Worker 스크립트 복사 설정도 제거했다.

## 검증 결과

문제가 발생했던 JPEG를 Safari에서 다시 등록했을 때 PNG 압축과 모의 등록 요청이 성공했고 `/trade/99` 상세 화면으로 이동했다.

- Safari 실제 등록 흐름 성공
- 이미지 압축 단위 테스트 통과
- ESLint 통과
- TypeScript 타입 검사 통과
- 프로덕션 빌드 성공

## 트레이드오프

PNG는 무손실 형식이므로 사진에서는 WebP나 JPEG보다 결과 파일이 커질 수 있다. 현재 최대 800px, 1MB 제한을 유지해 전송량을 제한하지만, 이미지 특성에 따라 해상도를 더 낮춰야 1MB에 도달할 수 있다.

향후 사진 용량을 더 줄이는 것이 중요해지면 다음 대안을 검토한다.

- Safari에서는 JPEG, WebP 인코딩을 지원하는 브라우저에서는 WebP를 사용하는 브라우저별 폴백
- Canvas 지원에 의존하지 않는 WASM 기반 WebP 인코더 도입
- 서버 또는 이미지 CDN에서 포맷 변환

이번 수정에서는 브라우저 간 동작 일관성과 구현 복잡도를 우선해 PNG를 선택했다.

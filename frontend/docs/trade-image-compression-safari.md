# Safari 이미지 압축 실패 조사와 PNG 폴백

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

프론트엔드에서 별도의 WASM 인코더를 추가하지 않고 WebP를 우선 사용하되, 브라우저가 WebP를 인코딩하지 못하면 PNG를 사용하도록 폴백을 추가했다. Safari라는 이름으로 분기하지 않고 실제 변환 결과의 MIME 타입과 예외를 기준으로 판단한다.

```ts
try {
  return await compress(file, 'image/webp');
} catch {
  return await compress(file, 'image/png');
}
```

변환 결과가 WebP면 `.webp`, `image/webp`로 저장하고 PNG면 `.png`, `image/png`로 저장한다. Worker를 사용하지 않고 일반 Canvas 경로를 유지해 Safari와 향후 WebView 환경에서도 같은 폴백을 적용한다.

## 검증 결과

문제가 발생했던 JPEG는 기존 PNG 전환 경로에서 Safari 등록에 성공했다. WebP 우선·PNG 폴백 변경 후에는 다음 분기를 단위 테스트로 검증했다.

- WebP 변환 성공
- WebP 예외 후 PNG 재압축 성공
- WebP 요청에 PNG가 반환되는 Safari 폴백 경로 성공
- 지원하지 않는 MIME 타입이 반환되면 PNG 재압축
- WebP와 PNG가 모두 실패하면 사용자용 오류 반환
- 이미지 압축 단위 테스트 통과
- ESLint 통과
- TypeScript 타입 검사 통과
- 프로덕션 빌드 성공

Safari 실제 등록 흐름은 변경된 폴백 코드로 한 번 더 확인한다.

## 트레이드오프

PNG는 무손실 형식이므로 사진에서는 WebP나 JPEG보다 결과 파일이 커질 수 있다. PNG는 WebP 인코딩을 지원하지 않는 환경에서만 사용하고, 최대 800px, 1MB 제한은 두 형식에 모두 적용한다.

향후 더 일관된 용량 절감이 중요해지면 다음 대안을 검토한다.

- Canvas 지원에 의존하지 않는 WASM 기반 WebP 인코더 도입
- 서버 또는 이미지 CDN에서 포맷 변환

이번 수정에서는 WebP의 용량 절감과 PNG의 호환성을 함께 가져가는 기능 기반 폴백을 선택했다.

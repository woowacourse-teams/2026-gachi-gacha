import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';

import PhotoUploader from 'gachi-web-photo-uploader';
import StickyActionBar from 'gachi-web-sticky-action-bar';

// These are the actual web components, resolved read-only by the browser test.
// Only their owning form and network-free submit sink are test substitutes.
const h = React.createElement;
const names = ['alpha.png', 'bravo.png', 'charlie.png', 'delta.png', 'echo.png'];
const existingPhotos = names.map((_, index) => {
  const canvas = document.createElement('canvas');
  canvas.width = 240;
  canvas.height = 240;
  const context = canvas.getContext('2d');
  context.fillStyle = ['#c8899d', '#699b93', '#b89868', '#8995bb', '#a581b0'][index];
  context.fillRect(0, 0, 240, 240);
  context.fillStyle = '#ffffff';
  context.font = 'bold 84px sans-serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(String(index+1), 120, 120);
  return canvas.toDataURL('image/png');
});
const initialFiles = names.map((name, index) => new File([
  Uint8Array.from(atob(existingPhotos[index].split(',')[1]), value => value.charCodeAt(0)),
], name, { type: 'image/png' }));
window.tradeSubmissions = [];
window.tradeAnalytics = [];
window.tradePointerEvents = [];
window.tradeDragEvents = [];
document.addEventListener('dragstart', event => {
  window.tradeDragEvents.push({ trusted: event.isTrusted, photo: event.target.closest?.('[data-trade-photo-index]')?.dataset.tradePhotoIndex });
}, true);
for (const type of ['pointerdown', 'pointermove', 'pointerup', 'pointercancel']) {
  document.addEventListener(type, event => {
    window.tradePointerEvents.push({ type, trusted: event.isTrusted, pointerType: event.pointerType });
  }, true);
}

function TradeFormFixture() {
  const isEdit = /^\/trade\/\d+\/edit$/.test(location.pathname);
  const existing = new URLSearchParams(location.search).has('existing');
  const formId = isEdit ? 'trade-edit-form' : 'trade-create-form';
  const [files, setFiles] = useState(existing ? [] : initialFiles);
  const [title, setTitle] = useState('유지할 거래 초안');
  const [isSubmitting, setIsSubmitting] = useState(false);
  useEffect(() => {
    window.tradeFixture = {
      names: files.map(file => file.name),
      title,
      formId,
      isSubmitting,
      reactVersion: React.version,
      setSubmitting: setIsSubmitting,
      setPhotoCount: count => setFiles(initialFiles.slice(0, count)),
    };
  }, [files, title, formId, isSubmitting]);

  return h(React.Fragment, null,
    h('div', { className: 'trade-page' },
      h('header', { className: 'app-header' }, '가치가챠'),
      h('main', { className: 'trade-main' },
        h('h1', null, isEdit ? '거래 글 수정' : '거래 글쓰기'),
        h('form', {
          id: formId,
          onSubmit: event => {
            event.preventDefault();
            window.tradeSubmissions.push({ names: files.map(file => file.name), title, formId });
          },
        },
        h(PhotoUploader, {
          files,
          initialImageUrls: existing ? existingPhotos : [],
          onFilesChange: setFiles,
        }),
        h('label', { className: 'title-label' }, '제목', h('input', {
          id: 'tradeTitle',
          name: 'title',
          value: title,
          onChange: event => setTitle(event.target.value),
        })),
        h('div', { className: 'long-content' }, '거래 정보'),
        h('label', null, '마지막 설명', h('textarea', {
          id: 'lastTradeField',
          name: 'description',
          defaultValue: '마지막 필드도 버튼에 가려지지 않아야 합니다.',
        }))),
        h(StickyActionBar, {
          formId,
          isSubmitting,
          submitLabel: isEdit ? '수정하기' : '등록하기',
          submittingLabel: isEdit ? '수정 중...' : '등록 중...',
        }))),
    h('footer', { id: 'unrelatedFooter' }, '사이트 공통 footer'),
  );
}

createRoot(document.getElementById('root')).render(h(TradeFormFixture));

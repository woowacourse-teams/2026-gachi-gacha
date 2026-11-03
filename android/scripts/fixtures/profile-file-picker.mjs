import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';

// Mirrors origin/main ProfileEditDialog's cancel/close and File ownership
// (2026-11-03), using the installed web React rather than native DOM stand-ins.
// In particular, React clears input.value while retaining the File in state.
const h = React.createElement;
window.profileCancelEvents = [];
window.profileCloseEvents = [];
window.profileChangeEvents = [];
window.profileSaveEvents = [];
document.addEventListener('cancel', event => {
  window.profileCancelEvents.push({ target: event.target.tagName, trusted: event.isTrusted });
}, true);

function ProfileFixture() {
  const dialogRef = useRef(null);
  const [open, setOpen] = useState(true);
  const [nickname, setNickname] = useState('원래 닉네임');
  const [place, setPlace] = useState('원래 거래 지역');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [inputVersion, setInputVersion] = useState(0);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);
  useEffect(() => {
    if (!file) { setPreview(null); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  useEffect(() => {
    window.profileFixture = { open, nickname, place, file, preview, reactVersion: React.version };
  }, [open, nickname, place, file, preview]);

  const close = () => dialogRef.current.close();
  return h(React.Fragment, null,
    h('button', { id: 'reopenProfile', onClick: () => setOpen(true) }, '프로필 수정'),
    h('dialog', {
      ref: dialogRef,
      'aria-labelledby': 'profile-edit-title',
      onCancel: event => {
        event.preventDefault();
        close();
      },
      onClose: () => {
        window.profileCloseEvents.push('close');
        setOpen(false);
      },
    },
    h('h2', { id: 'profile-edit-title' }, '프로필 수정'),
    h('button', { id: 'closeProfile', type: 'button', 'aria-label': '프로필 수정 창 닫기', onClick: close }, '×'),
    h('form', { onSubmit: event => {
      event.preventDefault();
      window.profileSaveEvents.push({ nickname, place, file, preview });
      close();
    } },
      h('label', null, '프로필 사진',
        h('input', {
          key: inputVersion,
          id: 'profileFile',
          type: 'file',
          accept: 'image/png',
          'aria-label': '프로필 사진 선택',
          onChange: event => {
            const nextFile = event.target.files?.[0];
            window.profileChangeEvents.push(nextFile?.name ?? null);
            event.target.value = '';
            if (nextFile) setFile(nextFile);
          },
        })),
      preview && h('img', { id: 'profilePreview', src: preview, width: 80, height: 80, alt: '새 프로필 사진 미리보기' }),
      h('label', null, '닉네임', h('input', { id: 'profileNickname', value: nickname, onChange: event => setNickname(event.target.value) })),
      h('label', null, '선호 거래 지역', h('input', { id: 'profilePlace', value: place, onChange: event => setPlace(event.target.value) })),
      h('button', { id: 'remountProfileFile', type: 'button', onClick: () => setInputVersion(value => value + 1) }, '사진 입력 다시 표시'),
      h('button', { id: 'cancelProfile', type: 'button', onClick: close }, '취소'),
      h('button', { id: 'saveProfile', type: 'submit' }, '저장하기'),
    )),
  );
}

createRoot(document.getElementById('root')).render(h(ProfileFixture));

import { fireEvent } from '@testing-library/react';

// Jest의 undici FormData는 HTMLFormElement를 받지 않아 React 제출 이벤트에서 보완한다.
export function submitSearchForm(form: HTMLFormElement) {
  const RequestFormData = globalThis.FormData;

  class HtmlFormData extends RequestFormData {
    constructor() {
      super();
    }
  }

  Object.defineProperty(globalThis, 'FormData', {
    configurable: true,
    value: HtmlFormData,
    writable: true,
  });

  try {
    fireEvent.submit(form);
  } finally {
    Object.defineProperty(globalThis, 'FormData', {
      configurable: true,
      value: RequestFormData,
      writable: true,
    });
  }
}

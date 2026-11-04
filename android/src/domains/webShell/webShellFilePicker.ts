/** Keep an OS file-picker dismissal separate from dismissing its web dialog. */
export function createWebShellFilePickerScript(): string {
  return `
    if (!window.__gachigachaAndroidFilePickerGuard) {
      document.addEventListener('cancel', (event) => {
        const input = event.target;
        if (
          input instanceof HTMLInputElement &&
          input.type === 'file' &&
          input.closest('dialog, [role="dialog"], [role="alertdialog"]')
        ) {
          // File-picker cancellation bubbles, unlike the dialog's own cancel.
          // React's ancestor onCancel otherwise mistakes it for closing the
          // editor. Capture before React without blocking change, preventing
          // the picker's default behavior, or suppressing the next real Back.
          event.stopPropagation();
        }
      }, true);
      window.__gachigachaAndroidFilePickerGuard = true;
    }
  `;
}

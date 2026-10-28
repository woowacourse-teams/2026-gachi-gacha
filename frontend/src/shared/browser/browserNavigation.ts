export function assignBrowserLocation(url: string): void {
  window.location.assign(url);
}

export function replaceBrowserLocation(url: string): void {
  window.location.replace(url);
}

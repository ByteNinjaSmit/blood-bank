// The app's real scroll container is <main id="app-main-scroll"> inside
// MasterLayout (the outer shell is `overflow-hidden`, so window/document
// never scrolls) — window.scrollTo alone is a no-op there. Also resets the
// window as a fallback for shell-less pages (login/register).
export function scrollAppToTop() {
  const main = document.getElementById('app-main-scroll');
  if (main) main.scrollTop = 0;
  window.scrollTo(0, 0);
}

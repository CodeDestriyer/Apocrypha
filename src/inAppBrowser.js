// In-app browsers (TikTok, Instagram, Facebook…) run in embedded webviews where
// Google sign-in is blocked (Error 403: disallowed_useragent). Detect them so we
// can tell the user to open the page in a real browser to register.
export function isInAppBrowser() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  return /(TikTok|musical_ly|BytedanceWebview|Bytedance|trill|Instagram|FBAN|FBAV|FB_IAB|FBIOS|Snapchat|Pinterest|Line\/|Twitter|WhatsApp|OKApp|VKClient)/i.test(ua);
}

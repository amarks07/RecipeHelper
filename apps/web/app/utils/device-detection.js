export function getDeviceType() {
  if (typeof window === "undefined") return "desktop";

  const ua = navigator.userAgent;
  const isAndroid = /android/i.test(ua);
  const isIOS = /iphone|ipad|ipod/i.test(ua);
  const isMobile = /mobile|android|iphone|ipad|ipod/i.test(ua);

  return {
    isAndroid,
    isIOS,
    isMobile,
    isDesktop: !isMobile,
    deviceType: isAndroid ? "android" : isIOS ? "ios" : "desktop",
  };
}

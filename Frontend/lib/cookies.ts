export async function clearCookies() {
  // Clear Cache Storage
  if ("caches" in window) {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map((name) => caches.delete(name)));
  }

  // Clear non-HttpOnly cookies
  document.cookie.split(";").forEach((cookie) => {
    document.cookie = cookie.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date(0).toUTCString() + ";path=/");
  });
}

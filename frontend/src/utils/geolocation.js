// Thin wrapper around the browser geolocation API, shared by anything that
// needs the user's coordinates (weather theming, the Map tab's "share my
// location" prompt).
export function getBrowserLocation(timeout = 8000) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error("Geolocation isn't supported by this browser."));
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(err),
      { timeout, maximumAge: 1000 * 60 * 5 }
    );
  });
}

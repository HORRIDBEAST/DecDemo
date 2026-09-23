import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';

// The backend's weather-fraud check geocodes the claim's location field as a place
// name (AI-Agents/src/agents/fraud_agent.py -> verify_historical_weather), so raw
// "lat, lng" would silently break that check. Reverse-geocode first, and only fall
// back to coordinates - with a caller-visible warning - if that lookup fails.
export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
      { headers: { Accept: 'application/json' } },
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data?.display_name ?? null;
  } catch {
    return null;
  }
}

export async function getDeviceCoordinates(): Promise<{ lat: number; lng: number }> {
  if (Capacitor.isNativePlatform()) {
    const pos = await Geolocation.getCurrentPosition();
    return { lat: pos.coords.latitude, lng: pos.coords.longitude };
  }
  if (!navigator.geolocation) {
    throw new Error('Location is not available on this browser.');
  }
  const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
    navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 }),
  );
  return { lat: pos.coords.latitude, lng: pos.coords.longitude };
}

/** Resolves the device's current location to a real address string, ready to drop
 * into a form field. Returns a flag so the caller can warn the user when it had to
 * fall back to raw coordinates. */
export async function getCurrentLocationAddress(): Promise<{ address: string; wasFallback: boolean }> {
  const { lat, lng } = await getDeviceCoordinates();
  const address = await reverseGeocode(lat, lng);
  if (address) return { address, wasFallback: false };
  return { address: `${lat.toFixed(5)}, ${lng.toFixed(5)}`, wasFallback: true };
}

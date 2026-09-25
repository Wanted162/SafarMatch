/**
 * SafarMatch — Geographic Utilities & Geocoding
 */

import { INDIAN_CIRCUITS_LOOKUP } from '../config/constants';

export function resolveCoordinatesForLocation(name: string): { lat: number; lng: number } | null {
  if (!name) return null;
  const trimmed = name.trim();
  if (INDIAN_CIRCUITS_LOOKUP[trimmed]) {
    return INDIAN_CIRCUITS_LOOKUP[trimmed];
  }

  // Case-insensitive substring match
  const lower = trimmed.toLowerCase();
  for (const [key, coords] of Object.entries(INDIAN_CIRCUITS_LOOKUP)) {
    if (key.toLowerCase().includes(lower) || lower.includes(key.toLowerCase())) {
      return coords;
    }
  }

  return null;
}

export async function geocodeLocationOnline(query: string): Promise<{ lat: number; lng: number } | null> {
  const direct = resolveCoordinatesForLocation(query);
  if (direct) return direct;

  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ', India')}&limit=1`);
    const data = await res.json();
    if (data && data.length > 0) {
      const lat = parseFloat(data[0].lat);
      const lng = parseFloat(data[0].lon);
      if (!isNaN(lat) && !isNaN(lng)) {
        return { lat, lng };
      }
    }
  } catch (err) {
    console.warn("Geocoding request failed:", err);
  }

  return null;
}

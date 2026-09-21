/**
 * Geolocation verification utilities using Haversine formula
 */

/**
 * Calculates distance between two latitude/longitude points in meters
 */
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

/**
 * Checks if the student is within the allowed radius of the configured attendance center
 */
export function isWithinAttendanceRadius(
  studentLat: number,
  studentLng: number,
  targetLat: number,
  targetLng: number,
  allowedRadiusMeters: number
): { isWithin: boolean; distanceMeters: number } {
  const distanceMeters = calculateDistanceMeters(
    studentLat,
    studentLng,
    targetLat,
    targetLng
  );
  return {
    isWithin: distanceMeters <= allowedRadiusMeters,
    distanceMeters,
  };
}

/**
 * Requests the current browser location once (not continuous tracking)
 */
export function getCurrentBrowserLocation(
  timeoutMs = 10000
): Promise<{ latitude: number; longitude: number; accuracy: number }> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Geolocation is not supported by your browser or device.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            reject(new Error('Location permission was denied. Please allow location access in your browser settings to verify attendance.'));
            break;
          case error.POSITION_UNAVAILABLE:
            reject(new Error('Location information is currently unavailable. Please try again.'));
            break;
          case error.TIMEOUT:
            reject(new Error('Location request timed out. Please check your GPS signal or network.'));
            break;
          default:
            reject(new Error('An unknown error occurred while retrieving your location.'));
        }
      },
      {
        enableHighAccuracy: true,
        timeout: timeoutMs,
        maximumAge: 0,
      }
    );
  });
}

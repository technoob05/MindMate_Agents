/**
 * Represents a geographical location with latitude and longitude coordinates.
 */
export interface Location {
  /**
   * The latitude of the location.
   */
  lat: number;
  /**
   * The longitude of the location.
   */
  lng: number;
}

/**
 * Represents information about a place.
 */
export interface Place {
  /**
   * The name of the place.
   */
  name: string;
  /**
   * The address of the place.
   */
  address: string;
  /**
   * The location of the place.
   */
  location: Location;
}

/**
 * Asynchronously retrieves nearby places of a specific type for a given location.
 *
 * @param location The location to search near.
 * @param type The type of place to search for (e.g., 'restaurant', 'hospital').
 * @returns A promise that resolves to an array of Place objects.
 */
export async function getNearbyPlaces(
  location: Location,
  type: string
): Promise<Place[]> {
  // TODO: Implement this by calling an API.

  return [
    {
      name: 'Sample Place',
      address: '123 Main St',
      location: { lat: 34.0522, lng: -118.2437 },
    },
  ];
}

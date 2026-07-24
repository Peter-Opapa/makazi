export interface GeocodeResult {
  lat: number;
  lng: number;
  formattedAddress?: string;
}

/** Implemented by both the real Google Maps client and the simulator; swap providers (Mapbox, HERE, OpenStreetMap/Nominatim) without touching callers. */
export interface MapsGateway {
  geocode(address: string): Promise<GeocodeResult | null>;
}
export const MAPS_GATEWAY = Symbol("MAPS_GATEWAY");

import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { GeocodeResult, MapsGateway } from "./maps-gateway.types";

/**
 * Real Google Maps Geocoding API client. Requires GOOGLE_MAPS_API_KEY;
 * falls back to MapsSimulatorService when unset (see IntegrationsModule's
 * gateway provider). Only geocoding is implemented — Makazi's only current
 * map need is turning a property's free-text location into coordinates for
 * future display; directions/places/static-map-image are not used anywhere
 * yet, so weren't built speculatively.
 */
@Injectable()
export class GoogleMapsService implements MapsGateway {
  private readonly logger = new Logger(GoogleMapsService.name);

  constructor(private readonly config: ConfigService) {}

  async geocode(address: string): Promise<GeocodeResult | null> {
    const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
    url.searchParams.set("address", address);
    url.searchParams.set("key", this.config.getOrThrow<string>("GOOGLE_MAPS_API_KEY"));

    const res = await fetch(url);
    const json = await res.json();

    if (!res.ok || json.status !== "OK") {
      this.logger.warn(`Geocoding failed for "${address}": ${json.status ?? res.status}`);
      return null;
    }

    const result = json.results?.[0];
    const location = result?.geometry?.location;
    if (!location) return null;

    return { lat: location.lat, lng: location.lng, formattedAddress: result.formatted_address };
  }
}

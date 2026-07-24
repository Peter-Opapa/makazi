import { Injectable, Logger } from "@nestjs/common";
import type { GeocodeResult, MapsGateway } from "./maps-gateway.types";

const NAIROBI = { lat: -1.286389, lng: 36.817223 };

/**
 * Stands in for GoogleMapsService when no API key is configured. Deterministic,
 * not random — the same address always geocodes to the same point (a small,
 * hash-derived jitter around Nairobi), so repeated calls and tests are stable.
 */
@Injectable()
export class MapsSimulatorService implements MapsGateway {
  private readonly logger = new Logger("Maps (simulated)");

  async geocode(address: string): Promise<GeocodeResult | null> {
    const hash = this.hash(address);
    const lat = NAIROBI.lat + (((hash % 1000) / 1000) * 2 - 1) * 0.15;
    const lng = NAIROBI.lng + ((((hash >> 10) % 1000) / 1000) * 2 - 1) * 0.15;
    this.logger.log(`geocoded "${address}" -> ${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    return { lat, lng, formattedAddress: address };
  }

  private hash(input: string): number {
    let h = 0;
    for (let i = 0; i < input.length; i++) {
      h = (h * 31 + input.charCodeAt(i)) | 0;
    }
    return Math.abs(h);
  }
}

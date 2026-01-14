"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { HiLocationMarker } from "react-icons/hi";

// Dynamically import map components to avoid SSR issues
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import("react-leaflet").then((mod) => mod.Popup),
  { ssr: false }
);

// Dhaka University default coordinates
const DHAKA_UNIVERSITY = {
  lat: 23.7336,
  lng: 90.3927,
};

type ItemLocationMapProps = {
  location?: string;
  title?: string;
};

// Try to extract coordinates from location string
function parseLocation(location?: string): { lat: number; lng: number } | null {
  if (!location) return null;

  // Try to match coordinate patterns like "23.7336, 90.3927" or "23.7336°N, 90.3927°E"
  const coordMatch = location.match(/(\d+\.?\d*)[°\s]*[NS]?[,\s]+(\d+\.?\d*)[°\s]*[EW]?/i);
  if (coordMatch) {
    const lat = parseFloat(coordMatch[1]);
    const lng = parseFloat(coordMatch[2]);
    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return { lat, lng };
    }
  }

  return null;
}

// Geocode address using OpenStreetMap Nominatim API
async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    // Add "Dhaka, Bangladesh" to help with local addresses
    const searchQuery = `${address}, Dhaka, Bangladesh`;
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'CampusLostFound/1.0' // Required by Nominatim
      }
    });
    
    if (!response.ok) return null;
    
    const data = await response.json();
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      };
    }
  } catch (error) {
    console.error("Geocoding error:", error);
  }
  return null;
}

export function ItemLocationMap({ location, title }: ItemLocationMapProps) {
  const [mounted, setMounted] = useState(false);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [geocoding, setGeocoding] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Dynamically import Leaflet to set up icons
    import("leaflet").then((L) => {
      // Fix for default marker icons
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });
    });

    // Try to parse coordinates from location string first
    const parsed = parseLocation(location);
    if (parsed) {
      setCoordinates(parsed);
    } else if (location) {
      // Try to geocode the address
      setGeocoding(true);
      geocodeAddress(location)
        .then((coords) => {
          if (coords) {
            setCoordinates(coords);
          } else {
            // Default to Dhaka University area if geocoding fails
            setCoordinates(DHAKA_UNIVERSITY);
          }
          setGeocoding(false);
        })
        .catch(() => {
          setCoordinates(DHAKA_UNIVERSITY);
          setGeocoding(false);
        });
    } else {
      // Default to Dhaka University area if no location
      setCoordinates(DHAKA_UNIVERSITY);
    }
  }, [location]);

  if (!mounted || !coordinates || geocoding) {
    return (
      <div className="relative h-[350px] w-full overflow-hidden rounded-2xl border border-base bg-card shadow-lg flex items-center justify-center">
        <p className="text-muted">{geocoding ? "Finding location..." : "Loading map..."}</p>
      </div>
    );
  }

  // Use a slightly wider zoom if we have a specific location (coordinates or geocoded), otherwise use default
  const hasSpecificLocation = parseLocation(location) || (location && coordinates !== DHAKA_UNIVERSITY);
  const zoom = hasSpecificLocation ? 16 : 15;

  return (
    <div className="-mt-2">
      <div className="relative h-[350px] w-full overflow-hidden rounded-xl border border-base">
        <MapContainer
          center={[coordinates.lat, coordinates.lng]}
          zoom={zoom}
          scrollWheelZoom={true}
          className="h-full w-full z-0"
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={[coordinates.lat, coordinates.lng]}>
            <Popup>
              <div className="text-center">
                {title && <h3 className="font-bold text-primary mb-1">{title}</h3>}
                {location ? (
                  <p className="text-sm text-muted">{location}</p>
                ) : (
                  <p className="text-sm text-muted">Dhaka University Area</p>
                )}
              </div>
            </Popup>
          </Marker>
        </MapContainer>
      </div>
      {location && (
        <div className="mt-3 rounded-lg border border-base bg-card p-3">
          <p className="text-sm font-semibold text-primary flex items-center gap-1 mb-1">
            <HiLocationMarker /> Item Location:
          </p>
          <p className="text-sm text-muted">{location}</p>
          {!parseLocation(location) && coordinates === DHAKA_UNIVERSITY && (
            <p className="text-xs text-muted mt-2 italic">
              Note: Could not find exact coordinates. Map shows general Dhaka University area. Location: {location}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

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

// Dhaka University coordinates
const DHAKA_UNIVERSITY = {
  lat: 23.7336,
  lng: 90.3927,
  name: "Dhaka University",
  address: "Dhaka University Area, Dhaka, Bangladesh",
};

export function CampusMap() {
  const [mounted, setMounted] = useState(false);

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
  }, []);

  if (!mounted) {
    return (
      <div className="relative h-[500px] w-full overflow-hidden rounded-2xl border border-base bg-card shadow-lg flex items-center justify-center">
        <p className="text-muted">Loading map...</p>
      </div>
    );
  }

  return (
    <div className="relative h-[500px] w-full overflow-hidden rounded-2xl border border-base shadow-lg">
      <MapContainer
        center={[DHAKA_UNIVERSITY.lat, DHAKA_UNIVERSITY.lng]}
        zoom={15}
        scrollWheelZoom={true}
        className="h-full w-full z-0"
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[DHAKA_UNIVERSITY.lat, DHAKA_UNIVERSITY.lng]}>
          <Popup>
            <div className="text-center">
              <h3 className="font-bold text-primary">{DHAKA_UNIVERSITY.name}</h3>
              <p className="text-sm text-muted">{DHAKA_UNIVERSITY.address}</p>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}

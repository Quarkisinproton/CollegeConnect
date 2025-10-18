
"use client";

import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet-routing-machine";
import { useEffect, useRef } from "react";

// Fix for default icon issues with webpack
import "leaflet/dist/leaflet.css";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});


const defaultPosition: L.LatLngTuple = [17.783, 83.378]; 

interface EventMapProps {
  interactive?: boolean;
  onLocationSelect?: (latlng: L.LatLng) => void;
  selectedLocation?: L.LatLng | null;
  eventLocation?: L.LatLng | null;
  userLocation?: L.LatLng | null;
  showRoute?: boolean;
}

const LocationMarker = ({ onLocationSelect, selectedLocation }: Pick<EventMapProps, 'onLocationSelect' | 'selectedLocation'>) => {
  useMapEvents({
    click(e) {
      onLocationSelect?.(e.latlng);
    },
  });

  return selectedLocation === null || selectedLocation === undefined ? null : (
    <Marker position={selectedLocation}>
      <Popup>You selected this location</Popup>
    </Marker>
  );
};

const Routing = ({ userLocation, eventLocation }: Pick<EventMapProps, 'userLocation' | 'eventLocation'>) => {
    const map = useMap();

    useEffect(() => {
        if (!userLocation || !eventLocation) return;
        
        const routingControl = L.Routing.control({
            waypoints: [
                L.latLng(userLocation.lat, userLocation.lng),
                L.latLng(eventLocation.lat, eventLocation.lng)
            ],
            routeWhileDragging: true,
            show: false, // Hides the itinerary
            addWaypoints: false,
            fitSelectedRoutes: true,
            lineOptions: {
              styles: [{ color: '#4169E1', opacity: 0.8, weight: 6 }]
            },
            createMarker: function() { return null; } // Hide default markers
        }).addTo(map);

        return () => {
          map.removeControl(routingControl);
        };
    }, [map, userLocation, eventLocation]);

    return null;
};

export default function EventMap({
  interactive = false,
  onLocationSelect,
  selectedLocation,
  eventLocation,
  userLocation,
  showRoute = false,
}: EventMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);

  const center = eventLocation || selectedLocation || L.latLng(defaultPosition[0], defaultPosition[1]);

  return (
    <div ref={mapRef} style={{ height: '100%', width: '100%' }}>
        <MapContainer center={center} zoom={16} scrollWheelZoom={true} className="rounded-lg h-full w-full z-0" maxBounds={[[17.7789300, 83.3724800], [17.7872100, 83.3817700]]}>
        <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {interactive && <LocationMarker onLocationSelect={onLocationSelect} selectedLocation={selectedLocation} />}
        {eventLocation && <Marker position={eventLocation}><Popup>Event Location</Popup></Marker>}
        {userLocation && <Marker position={userLocation}><Popup>Your Location</Popup></Marker>}
        {showRoute && userLocation && eventLocation && <Routing userLocation={userLocation} eventLocation={eventLocation} />}
        </MapContainer>
    </div>
  );
}

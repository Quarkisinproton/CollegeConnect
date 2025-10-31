
"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet-routing-machine";

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

export default function EventMap({
  interactive = false,
  onLocationSelect,
  selectedLocation,
  eventLocation,
  userLocation,
  showRoute = false,
}: EventMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const routingControlRef = useRef<L.Routing.Control | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    if (mapRef.current && !mapInstanceRef.current) {
      const center = eventLocation || selectedLocation || L.latLng(defaultPosition[0], defaultPosition[1]);
      
      const map = L.map(mapRef.current, {
        center: center,
        zoom: 16,
        scrollWheelZoom: true,
      });
      mapInstanceRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

       // Set map bounds
      map.setMaxBounds([[17.7789300, 83.3724800], [17.7872100, 83.3817700]]);

      if (interactive) {
        map.on('click', (e) => {
          onLocationSelect?.(e.latlng);
        });
      }
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []); // Only run once on mount and unmount

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear previous markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    if (selectedLocation) {
        const marker = L.marker(selectedLocation).addTo(map).bindPopup("You selected this location");
        markersRef.current.push(marker);
    }
    if (eventLocation) {
        const marker = L.marker(eventLocation).addTo(map).bindPopup("Event Location");
        markersRef.current.push(marker);
    }
    if (userLocation) {
        const marker = L.marker(userLocation).addTo(map).bindPopup("Your Location");
        markersRef.current.push(marker);
    }

  }, [selectedLocation, eventLocation, userLocation]);


  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    
    // Remove existing routing control if it exists
    if (routingControlRef.current) {
        map.removeControl(routingControlRef.current);
        routingControlRef.current = null;
    }

    if (showRoute && userLocation && eventLocation) {
    const routingControl = L.Routing.control(({
      waypoints: [
        L.latLng(userLocation.lat, userLocation.lng),
        L.latLng(eventLocation.lat, eventLocation.lng)
      ],
      routeWhileDragging: true,
      show: false,
      addWaypoints: false,
      fitSelectedRoutes: true,
      lineOptions: ({ styles: [{ color: '#4169E1', opacity: 0.8, weight: 6 }] } as any),
      createMarker: function() { return null; }
    } as any)).addTo(map);
        routingControlRef.current = routingControl;
    }
  }, [showRoute, userLocation, eventLocation]);

  return <div ref={mapRef} className="rounded-lg h-full w-full z-0" />;
}

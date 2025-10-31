
"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";

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
  routePath?: Array<{lat: number; lng: number}> | null;
  startSnap?: {original: {lat: number; lng: number}; snapped: {lat: number; lng: number}} | null;
  endSnap?: {original: {lat: number; lng: number}; snapped: {lat: number; lng: number}} | null;
}

export default function EventMap({
  interactive = false,
  onLocationSelect,
  selectedLocation,
  eventLocation,
  userLocation,
  showRoute = false,
  routePath,
  startSnap,
  endSnap,
}: EventMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);
  const snapLinesRef = useRef<L.Polyline[]>([]);
  const markersRef = useRef<L.Marker[]>([]);
  const fitTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (mapRef.current && !mapInstanceRef.current) {
      const center = eventLocation || selectedLocation || L.latLng(defaultPosition[0], defaultPosition[1]);
      
      const map = L.map(mapRef.current, {
        center: center,
        zoom: 16,
        scrollWheelZoom: true,
        preferCanvas: true,
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
      // cleanup any pending fit timeouts
      if (fitTimeoutRef.current) {
        window.clearTimeout(fitTimeoutRef.current);
        fitTimeoutRef.current = null;
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
    
    // Remove existing route polyline if it exists
    if (routePolylineRef.current) {
      map.removeLayer(routePolylineRef.current);
      routePolylineRef.current = null;
    }

    // Remove existing snap lines
    snapLinesRef.current.forEach(line => map.removeLayer(line));
    snapLinesRef.current = [];

  // Draw the custom route path if available
  const shouldDraw = !!routePath && routePath.length > 0 && (showRoute || true);
  if (shouldDraw) {
      // Draw snap lines (original to snapped points) in red dashed style
      if (startSnap) {
        const snapLine = L.polyline(
          [[startSnap.original.lat, startSnap.original.lng], [startSnap.snapped.lat, startSnap.snapped.lng]],
          { color: '#EF4444', weight: 2, dashArray: '5, 5', opacity: 0.7 }
        ).addTo(map);
        snapLinesRef.current.push(snapLine);
      }
      if (endSnap) {
        const snapLine = L.polyline(
          [[endSnap.original.lat, endSnap.original.lng], [endSnap.snapped.lat, endSnap.snapped.lng]],
          { color: '#EF4444', weight: 2, dashArray: '5, 5', opacity: 0.7 }
        ).addTo(map);
        snapLinesRef.current.push(snapLine);
      }

      // Draw the main route polyline in blue
      const latlngs: L.LatLngExpression[] = routePath.map(p => [p.lat, p.lng]);
      const polyline = L.polyline(latlngs, {
        color: '#4169E1',
        weight: 6,
        opacity: 0.8,
      }).addTo(map);
      
      routePolylineRef.current = polyline;
      
      // Fit map to show the entire route (debounced to avoid jank on rapid updates)
      if (fitTimeoutRef.current) {
        window.clearTimeout(fitTimeoutRef.current);
      }
      fitTimeoutRef.current = window.setTimeout(() => {
        try {
          map.fitBounds(polyline.getBounds(), { padding: [50, 50] });
        } catch (e) {
          // no-op
        }
      }, 50);
    }
  }, [showRoute, routePath, startSnap, endSnap]);

  return <div ref={mapRef} className="rounded-lg h-full w-full z-0" />;
}

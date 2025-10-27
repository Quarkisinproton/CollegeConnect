
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
  // Custom route path to render (polyline) from backend navigation service
  routePath?: Array<{ lat: number; lng: number }> | null;
  // Snap segments to visualize when start/end were adjusted to nearest road
  startSnap?: { original: { lat: number; lng: number }; snapped: { lat: number; lng: number } } | null;
  endSnap?: { original: { lat: number; lng: number }; snapped: { lat: number; lng: number } } | null;
}

export default function EventMap({
  interactive = false,
  onLocationSelect,
  selectedLocation,
  eventLocation,
  userLocation,
  routePath = null,
  startSnap = null,
  endSnap = null,
}: EventMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const isUnmountingRef = useRef(false);
  const polylineRef = useRef<L.Polyline | null>(null);
  const snapLinesRef = useRef<L.Polyline[]>([]);

  useEffect(() => {
    // Reset unmounting flag on mount
    isUnmountingRef.current = false;
    
    console.log('[EventMap] Effect running - interactive:', interactive, 'onLocationSelect:', !!onLocationSelect, 'mapInstanceRef.current:', !!mapInstanceRef.current);
    
    if (mapRef.current && !mapInstanceRef.current) {
      console.log('[EventMap] Creating new map instance');
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
        console.log('[EventMap] Attaching click handler to map');
        map.on('click', (e) => {
          console.log('[EventMap] MAP CLICKED!', e.latlng);
          if (onLocationSelect) {
            console.log('[EventMap] Calling onLocationSelect with:', e.latlng);
            onLocationSelect(e.latlng);
          } else {
            console.log('[EventMap] onLocationSelect is not defined!');
          }
        });
        console.log('[EventMap] Click handler attached successfully');
      } else {
        console.log('[EventMap] Interactive is false, not attaching click handler');
        // Remove click handler if it was previously attached
        map.off('click');
      }
    } else {
      console.log('[EventMap] Skipping map creation - mapRef.current:', !!mapRef.current, 'mapInstanceRef.current:', !!mapInstanceRef.current);
    }

    // Update click handler when interactive or onLocationSelect changes
    if (mapInstanceRef.current && interactive && onLocationSelect) {
      const map = mapInstanceRef.current;
      // Remove any existing click handlers
      map.off('click');
      // Add new click handler
      console.log('[EventMap] Re-attaching click handler for interactive mode');
      map.on('click', (e) => {
        console.log('[EventMap] MAP CLICKED (updated handler)!', e.latlng);
        onLocationSelect(e.latlng);
      });
    }

    return () => {
      // Mark as unmounting to avoid any late-running effects
      isUnmountingRef.current = true;

      const map = mapInstanceRef.current;
      try {
        // Remove polyline if exists
        if (polylineRef.current) {
          try { polylineRef.current.remove(); } catch {}
          polylineRef.current = null;
        }

        // Remove markers
        markersRef.current.forEach(m => {
          try { m.remove(); } catch {}
        });
        markersRef.current = [];

        // Detach listeners and remove the map
        if (map) {
          try { map.off(); } catch {}
          try { map.remove(); } catch {}
        }
      } finally {
        mapInstanceRef.current = null;
      }
    };
  }, []); // Only run once on mount and unmount

  useEffect(() => {
    console.log('[EventMap] Marker effect running - selectedLocation:', selectedLocation, 'eventLocation:', eventLocation, 'userLocation:', userLocation);
    if (isUnmountingRef.current) {
      console.log('[EventMap] Component is unmounting, skipping marker update');
      return;
    }
    const map = mapInstanceRef.current;
    if (!map) {
      console.log('[EventMap] Map instance not ready, skipping marker update');
      return;
    }

    console.log('[EventMap] Clearing previous markers, count:', markersRef.current.length);
    // Clear previous markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    if (selectedLocation) {
        console.log('[EventMap] Adding selected location marker at:', selectedLocation);
        const marker = L.marker(selectedLocation).addTo(map).bindPopup("You selected this location");
        markersRef.current.push(marker);
        console.log('[EventMap] Marker added successfully');
    }
    if (eventLocation) {
        console.log('[EventMap] Adding event location marker');
        const marker = L.marker(eventLocation).addTo(map).bindPopup("Event Location");
        markersRef.current.push(marker);
    }
    if (userLocation) {
        console.log('[EventMap] Adding user location marker');
        const marker = L.marker(userLocation).addTo(map).bindPopup("Your Location");
        markersRef.current.push(marker);
    }

  }, [selectedLocation, eventLocation, userLocation]);


  useEffect(() => {
    console.log('[EventMap] Route effect - routePath:', routePath?.length || 0);
    if (isUnmountingRef.current) {
      console.log('[EventMap] Route effect skipped: unmounting');
      return;
    }
    const map = mapInstanceRef.current;
    if (!map) {
      console.log('[EventMap] Route effect skipped: map not ready');
      return;
    }
    // Remove existing polyline
    if (polylineRef.current) {
      try { polylineRef.current.remove(); } catch {}
      polylineRef.current = null;
    }
    // Remove existing snap lines
    snapLinesRef.current.forEach(line => {
      try { line.remove(); } catch {}
    });
    snapLinesRef.current = [];

    if (routePath && routePath.length >= 2) {
      const latlngs = routePath.map(p => L.latLng(p.lat, p.lng));
      const poly = L.polyline(latlngs, { color: '#4169E1', opacity: 0.9, weight: 6 });
      poly.addTo(map);
      polylineRef.current = poly;
      
      // Draw snap segments if present (dashed gray lines from original to snapped point)
      if (startSnap) {
        const snapLine = L.polyline(
          [L.latLng(startSnap.original.lat, startSnap.original.lng), L.latLng(startSnap.snapped.lat, startSnap.snapped.lng)],
          { color: '#888', opacity: 0.6, weight: 3, dashArray: '5, 10' }
        );
        snapLine.addTo(map).bindPopup("Start snapped to nearest road");
        snapLinesRef.current.push(snapLine);
      }
      if (endSnap) {
        const snapLine = L.polyline(
          [L.latLng(endSnap.original.lat, endSnap.original.lng), L.latLng(endSnap.snapped.lat, endSnap.snapped.lng)],
          { color: '#888', opacity: 0.6, weight: 3, dashArray: '5, 10' }
        );
        snapLine.addTo(map).bindPopup("Destination snapped to nearest road");
        snapLinesRef.current.push(snapLine);
      }
      
      // Fit map to route
      try { map.fitBounds(poly.getBounds(), { padding: [20, 20] } as any); } catch {}
      console.log('[EventMap] Route polyline drawn, points:', routePath.length);
    } else {
      console.log('[EventMap] routePath empty or invalid; nothing to draw');
    }
  }, [routePath, startSnap, endSnap]);

  return <div ref={mapRef} className="rounded-lg h-full w-full z-0" />;
}

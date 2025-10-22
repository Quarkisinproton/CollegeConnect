
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
  const isUnmountingRef = useRef(false);

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
            console.log('[EventMap] Calling onLocationSelect');
            onLocationSelect(e.latlng);
          } else {
            console.log('[EventMap] onLocationSelect is not defined!');
          }
        });
        console.log('[EventMap] Click handler attached');
      } else {
        console.log('[EventMap] Interactive is false, not attaching click handler');
      }
    } else {
      console.log('[EventMap] Skipping map creation - mapRef.current:', !!mapRef.current, 'mapInstanceRef.current:', !!mapInstanceRef.current);
    }

    return () => {
      // Mark as unmounting to avoid any late-running effects
      isUnmountingRef.current = true;

      const map = mapInstanceRef.current;
      try {
        // Proactively remove routing control first (some plugins expect a live map during cleanup)
        if (map && routingControlRef.current) {
          try {
            map.removeControl(routingControlRef.current);
          } catch (e) {
            // swallow – best-effort cleanup
          } finally {
            routingControlRef.current = null;
          }
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
    if (isUnmountingRef.current) return;
    const map = mapInstanceRef.current;
    if (!map) return;
    
    // Remove existing routing control if it exists
    if (routingControlRef.current) {
        // Some routers finish asynchronously and try to clear lines after control removal,
        // which can throw if the control's map is already nulled. Defer removal safely.
        const ctrl = routingControlRef.current;
        routingControlRef.current = null;
        try {
          // Best-effort: clear waypoints to cancel pending requests
          (ctrl as any)?.setWaypoints?.([]);
        } catch {}
        setTimeout(() => {
          try { map.removeControl(ctrl); } catch {}
        }, 0);
    }

    if (showRoute && userLocation && eventLocation) {
    // Guard against the routing plugin not being available
    if (!(L as any).Routing || !(L as any).Routing.control) return;
    const routingControl = (L as any).Routing.control(({
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

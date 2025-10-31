
"use client";

import { useEffect, useRef, memo, useCallback, useMemo } from "react";
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

function EventMap({
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

  // Memoize the center calculation to avoid recalculations
  const mapCenter = useMemo(() => {
    return eventLocation || selectedLocation || L.latLng(defaultPosition[0], defaultPosition[1]);
  }, [eventLocation, selectedLocation]);

  // Memoize route path latLngs to prevent unnecessary polyline recreations
  const routeLatLngs = useMemo(() => {
    if (!routePath || routePath.length < 2) return null;
    return routePath.map(p => L.latLng(p.lat, p.lng));
  }, [routePath]);

  // Memoize click handler to prevent unnecessary map listener updates
  const handleMapClick = useCallback((e: L.LeafletMouseEvent) => {
    if (onLocationSelect) {
      onLocationSelect(e.latlng);
    }
  }, [onLocationSelect]);

  useEffect(() => {
    // Reset unmounting flag on mount
    isUnmountingRef.current = false;
    
    if (mapRef.current && !mapInstanceRef.current) {
      const map = L.map(mapRef.current, {
        center: mapCenter,
        zoom: 16,
        scrollWheelZoom: true,
        preferCanvas: true, // Use Canvas renderer for better performance with many markers
        renderer: L.canvas({ tolerance: 5 }), // Increase click tolerance for better mobile UX
      });
      mapInstanceRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

       // Set map bounds
      map.setMaxBounds([[17.7789300, 83.3724800], [17.7872100, 83.3817700]]);

      if (interactive && handleMapClick) {
        map.on('click', handleMapClick);
      }
    }
    
    return () => {
      isUnmountingRef.current = true;
    };
  }, [mapCenter, interactive, handleMapClick]);

  // Separate effect for updating click handlers when interactive mode changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Remove existing click handlers
    map.off('click');
    
    // Add handler if interactive
    if (interactive && handleMapClick) {
      map.on('click', handleMapClick);
    }

    return () => {
      const map = mapInstanceRef.current;
      if (map) {
        map.off('click');
      }
    };
  }, [interactive, handleMapClick]);

  // Cleanup effect - runs only on unmount
  useEffect(() => {
    return () => {
      // Mark as unmounting to avoid any late-running effects
      isUnmountingRef.current = true;

      const map = mapInstanceRef.current;
      
      // Remove polyline if exists
      if (polylineRef.current) {
        try { 
          polylineRef.current.remove(); 
        } catch (e) {
          console.error('Error removing polyline:', e);
        }
        polylineRef.current = null;
      }

      // Remove snap lines
      snapLinesRef.current.forEach(line => {
        try { 
          line.remove(); 
        } catch (e) {
          console.error('Error removing snap line:', e);
        }
      });
      snapLinesRef.current = [];

      // Remove markers
      markersRef.current.forEach(m => {
        try { 
          m.remove(); 
        } catch (e) {
          console.error('Error removing marker:', e);
        }
      });
      markersRef.current = [];

      // Detach all listeners and remove the map
      if (map) {
        try { 
          map.off(); 
          map.remove(); 
        } catch (e) {
          console.error('Error cleaning up map:', e);
        }
      }
      
      mapInstanceRef.current = null;
    };
  }, []); // Only run on unmount

  useEffect(() => {
    if (isUnmountingRef.current) {
      return;
    }
    const map = mapInstanceRef.current;
    if (!map) {
      return;
    }

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
    if (isUnmountingRef.current) {
      return;
    }
    const map = mapInstanceRef.current;
    if (!map) {
      return;
    }
    // Remove existing polyline
    if (polylineRef.current) {
      try { 
        polylineRef.current.remove(); 
      } catch (e) {
        console.error('Error removing existing polyline:', e);
      }
      polylineRef.current = null;
    }
    // Remove existing snap lines
    snapLinesRef.current.forEach(line => {
      try { 
        line.remove(); 
      } catch (e) {
        console.error('Error removing snap line:', e);
      }
    });
    snapLinesRef.current = [];

    if (routeLatLngs && routeLatLngs.length >= 2) {
      const poly = L.polyline(routeLatLngs, { 
        color: '#4169E1', 
        opacity: 0.9, 
        weight: 6,
        smoothFactor: 1.0 // Reduce complexity for better performance
      });
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
      
      // Fit map to route with animation disabled for better performance
      try { 
        map.fitBounds(poly.getBounds(), { 
          padding: [20, 20],
          animate: false // Disable animation for faster rendering
        } as any); 
      } catch (e) {
        console.error('Error fitting bounds:', e);
      }
    }
  }, [routeLatLngs, startSnap, endSnap]);

  return <div ref={mapRef} className="rounded-lg h-full w-full z-0" />;
}

// Export memoized component to prevent unnecessary re-renders
export default memo(EventMap, (prevProps, nextProps) => {
  // Custom comparison to optimize re-renders
  return (
    prevProps.interactive === nextProps.interactive &&
    prevProps.selectedLocation === nextProps.selectedLocation &&
    prevProps.eventLocation === nextProps.eventLocation &&
    prevProps.userLocation === nextProps.userLocation &&
    prevProps.routePath === nextProps.routePath &&
    prevProps.startSnap === nextProps.startSnap &&
    prevProps.endSnap === nextProps.endSnap &&
    prevProps.onLocationSelect === nextProps.onLocationSelect
  );
});

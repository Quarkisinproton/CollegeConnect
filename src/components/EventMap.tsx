
"use client";

import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents, GeoJSON } from "react-leaflet";
import L from "leaflet";
import "leaflet-routing-machine";
import { useEffect, useState, useRef } from "react";
import collegeData from "@/lib/college.json";

// Fix for default icon issues with webpack
import "leaflet/dist/leaflet.css";

// This check is to prevent the error in some environments, though might not be the root cause.
if (typeof L !== 'undefined' && L.Icon.Default.prototype instanceof L.Icon) {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });
}


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
    const [routingControl, setRoutingControl] = useState<L.Routing.Control | null>(null);

    useEffect(() => {
        if (!map || !userLocation || !eventLocation) return;
        
        if (routingControl) {
            map.removeControl(routingControl);
        }

        const newRoutingControl = L.Routing.control({
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
        setRoutingControl(newRoutingControl);

        return () => {
          if (map && newRoutingControl) {
            map.removeControl(newRoutingControl);
          }
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const center = eventLocation || selectedLocation || L.latLng(defaultPosition[0], defaultPosition[1]);

  useEffect(() => {
    if (containerRef.current && mapRef.current === null) {
      // Create map instance
      const map = L.map(containerRef.current!, {
        center: center,
        zoom: 16,
        scrollWheelZoom: true,
      });
      mapRef.current = map;

      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);

      // Set bounds
      map.setMaxBounds([[17.7789300, 83.3724800], [17.7872100, 83.3817700]]);
    }
  }, [center]);

   // Add GeoJSON, markers, and routing as layers to the existing map
   useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear existing layers to prevent duplicates on re-render
    map.eachLayer(layer => {
      if (layer instanceof L.GeoJSON || layer instanceof L.Marker || layer instanceof L.Polyline) {
        map.removeLayer(layer);
      }
    });
    
    // Add base tile layer if it was removed
    let hasTileLayer = false;
    map.eachLayer(layer => {
      if (layer instanceof L.TileLayer) {
        hasTileLayer = true;
      }
    });
    if (!hasTileLayer) {
       L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);
    }


    L.geoJSON(collegeData as any).addTo(map);

    if (interactive && selectedLocation) {
      L.marker(selectedLocation).addTo(map).bindPopup('You selected this location');
    }

    if (eventLocation) {
      L.marker(eventLocation).addTo(map).bindPopup('Event Location');
    }

    if (userLocation) {
      L.marker(userLocation).addTo(map).bindPopup('Your Location');
    }
    
    if (showRoute && userLocation && eventLocation) {
        L.Routing.control({
            waypoints: [userLocation, eventLocation],
            routeWhileDragging: true,
            show: false,
            addWaypoints: false,
            fitSelectedRoutes: true,
            lineOptions: {
              styles: [{ color: '#4169E1', opacity: 0.8, weight: 6 }]
            },
            createMarker: () => null
        }).addTo(map);
    }
    
    if(interactive) {
        map.on('click', (e) => {
            onLocationSelect?.(e.latlng);
        });
    }

    // Cleanup map event listeners
    return () => {
        if(map) {
           map.off('click');
        }
    }

  }, [interactive, onLocationSelect, selectedLocation, eventLocation, userLocation, showRoute]);


  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return (
    <div ref={containerRef} className="rounded-lg h-full w-full z-0" />
  );
}

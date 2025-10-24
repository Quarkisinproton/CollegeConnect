
"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';
import { Timestamp } from "firebase/firestore";
import L from "leaflet";
import { Loader } from "@/components/ui/loader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Calendar, Clock, MapPin, Navigation, User } from "lucide-react";
import { format } from "date-fns";
import type { CampusEvent } from "@/types";
import { useToast } from "@/hooks/use-toast";

const EventMap = dynamic(() => import('@/components/EventMap'), {
  ssr: false,
  loading: () => <div className="h-full w-full flex items-center justify-center bg-muted rounded-lg"><Loader /></div>,
});


export default function EventDetailsPage() {
  console.log("LOG: EventDetailsPage component rendered or re-rendered.");
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();

  console.log(`LOG: Event ID from params: ${id}`);

  const [event, setEvent] = useState<CampusEvent | null>(null);
  const [eventLoading, setEventLoading] = useState(true);
  const [eventError, setEventError] = useState<string | null>(null);

  // Fetch event from backend API
  useEffect(() => {
    if (!id) return;
    
    let active = true;
    setEventLoading(true);
    setEventError(null);

    console.log(`LOG: Fetching event with id: ${id} from backend API`);
    
    fetch(`/api/events/${id}`)
      .then(async (res) => {
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error('Event not found');
          }
          throw new Error('Failed to load event');
        }
        return res.json();
      })
      .then((data: CampusEvent) => {
        if (!active) return;
        console.log('LOG: Event fetched from backend:', data);
        setEvent(data);
      })
      .catch((err) => {
        if (!active) return;
        console.error('LOG: Error fetching event:', err);
        setEventError(err.message || 'Failed to load event');
      })
      .finally(() => {
        if (active) setEventLoading(false);
      });

    return () => { active = false; };
  }, [id]);

  useEffect(() => {
    console.log(`LOG: Event state change - isLoading: ${eventLoading}, event: ${event ? 'Exists' : 'null'}, error: ${eventError}`);
  }, [event, eventLoading, eventError]);


  const [userLocation, setUserLocation] = useState<L.LatLng | null>(null);
  const [showRoute, setShowRoute] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [permissionDialogOpen, setPermissionDialogOpen] = useState(false);
  const [locationDebugInfo, setLocationDebugInfo] = useState<string>("");
  const initialLoadComplete = useRef(false);
  const watchIdRef = useRef<number | null>(null);

  // Cleanup geolocation watch on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        console.log("LOG: Component unmounting, clearing geolocation watch:", watchIdRef.current);
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    console.log('LOG: permissionDialogOpen changed ->', permissionDialogOpen);
  }, [permissionDialogOpen]);

  useEffect(() => {
    console.log('LOG: userLocation updated ->', userLocation);
  }, [userLocation]);

  useEffect(() => {
    console.log(`LOG: Toast useEffect running - eventLoading: ${eventLoading}, initialLoadComplete: ${initialLoadComplete.current}`);
    
    if (eventLoading) {
      console.log("LOG: Toast useEffect - Still loading, exiting effect.");
      return;
    }
    
    // This now only runs when loading is definitively complete.
    if (!initialLoadComplete.current) {
        console.log("LOG: Toast useEffect - Initial load is now complete.");
        initialLoadComplete.current = true;
    }

    if (initialLoadComplete.current && !event) {
        console.log("LOG: Toast useEffect - Firing 'Event not found' toast.");
        toast({ variant: "destructive", title: "Error", description: "Event not found." });
    }
  }, [event, eventLoading, toast])


  const requestGeolocation = async () => {
    console.log("LOG: requestGeolocation called.");
    setPermissionDialogOpen(false);

    if (!navigator.geolocation) {
      console.error("LOG: Geolocation API not supported.");
      toast({ variant: "destructive", title: "Geolocation not supported", description: "Your browser doesn't support geolocation." });
      return;
    }

    // Clear any existing watch
    if (watchIdRef.current !== null) {
      console.log("LOG: Clearing existing geolocation watch:", watchIdRef.current);
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    // Don't block on permissions API (not supported consistently). Use it only for diagnostics.
    try {
      // @ts-ignore
      const perm: any = await (navigator.permissions?.query?.({ name: 'geolocation' as any }) ?? Promise.resolve(null));
      if (perm) console.log(`LOG: Permissions API state: ${perm.state}`);
    } catch (e) {
      console.log('LOG: Permissions API not available, continuing with direct geolocation call.');
    }

    setIsNavigating(true);
    console.log("LOG: Calling navigator.geolocation.watchPosition (this should trigger the native prompt if not already decided)...");
    
    // Use watchPosition for continuous updates to get the most accurate location
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const debugInfo = `📍 Position Update:
• Lat: ${position.coords.latitude.toFixed(6)}
• Lng: ${position.coords.longitude.toFixed(6)}
• Accuracy: ${Math.round(position.coords.accuracy)}m
• Altitude: ${position.coords.altitude ?? 'N/A'}
• Speed: ${position.coords.speed ?? 'N/A'}
• Timestamp: ${new Date(position.timestamp).toLocaleString()}
• Age: ${Math.round((Date.now() - position.timestamp) / 1000)}s ago`;
        
        setLocationDebugInfo(debugInfo);
        
        console.log("LOG: Geolocation success.", {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date(position.timestamp).toISOString(),
          ageSeconds: Math.round((Date.now() - position.timestamp) / 1000)
        });
        
        // Update location
        const newLocation = L.latLng(position.coords.latitude, position.coords.longitude);
        setUserLocation(newLocation);
        setShowRoute(true);
        
        toast({ 
          title: "Location Updated", 
          description: `Accuracy: ${Math.round(position.coords.accuracy)}m. Route calculated from your current location.` 
        });
        
        setIsNavigating(false);
        
        // Stop watching after first accurate position (< 50m accuracy)
        if (position.coords.accuracy < 50) {
          console.log("LOG: Good accuracy achieved, stopping watch.");
          if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
          }
        }
      },
      (error) => {
        console.error("LOG: Geolocation error.", error);
        let description = "We couldn't access your location. Click the lock icon in the address bar and allow Location for this site, then try again.";
        if (error.code === error.PERMISSION_DENIED) {
          description = "Location permission is blocked. Click the lock icon in the address bar -> Site settings -> Allow Location, then try again.";
        } else if (error.code === error.TIMEOUT) {
          description = "Location request timed out. Make sure GPS is enabled and try again.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          description = "Location unavailable. Make sure location services are enabled on your device.";
        }
        toast({ variant: "destructive", title: "Location Error", description });
        setIsNavigating(false);
        if (watchIdRef.current !== null) {
          navigator.geolocation.clearWatch(watchIdRef.current);
          watchIdRef.current = null;
        }
      },
      {
        enableHighAccuracy: true,  // Use GPS for best accuracy
        maximumAge: 0,             // Don't use cached position - force fresh reading
        timeout: 30000,            // Wait up to 30 seconds for accurate position
      }
    );
  };

  const handleNavigateClick = () => {
    console.log("LOG: handleNavigateClick called.");
    // Directly open the custom dialog to ask for permission first.
    console.log("LOG: Opening permission dialog.");
    setPermissionDialogOpen(true);
  };

  const handleManualLocationSet = (location: L.LatLng) => {
    console.log("LOG: Manual location set:", location);
    setUserLocation(location);
    setShowRoute(true);
    setLocationDebugInfo(`📍 Manual Location Set:
• Lat: ${location.lat.toFixed(6)}
• Lng: ${location.lng.toFixed(6)}
• Source: Manual selection on map`);
    toast({ title: "Start Location Set", description: "Route calculated from selected location." });
  };


  if (eventLoading && !initialLoadComplete.current) {
    console.log("LOG: Render - Showing main loader as initial load is not complete.");
    return <div className="flex h-[calc(100vh-4rem)] items-center justify-center"><Loader className="h-12 w-12" /></div>;
  }

  if (!event) {
    console.log("LOG: Render - Event is falsy after initial load. Showing 'Event not found' message.");
    return <div className="flex h-[calc(100vh-4rem)] items-center justify-center"><p>Event not found.</p></div>;
  }
  
  console.log("LOG: Render - Event data is available. Rendering page content.");
  
  // Convert dateTime from ISO string to Date if needed
  let dateTimeObj: Date;
  if (event.dateTime instanceof Date) {
    dateTimeObj = event.dateTime;
  } else if (typeof event.dateTime === 'string') {
    dateTimeObj = new Date(event.dateTime);
  } else if ((event.dateTime as any) instanceof Timestamp) {
    dateTimeObj = ((event.dateTime as any) as Timestamp).toDate();
  } else {
    dateTimeObj = new Date();
  }
  
  const displayEvent = {...event, dateTime: dateTimeObj};

  const eventLocation = L.latLng(displayEvent.location.lat, displayEvent.location.lng);

  return (
    <>
      <AlertDialog open={permissionDialogOpen} onOpenChange={setPermissionDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Location Permission Required</AlertDialogTitle>
            <AlertDialogDescription>
              To show you the route, Campus Connect needs to access your device's location. Please click "Allow" to continue.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsNavigating(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={requestGeolocation}>Allow</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="container py-8">
        <div className="grid lg:grid-cols-5 gap-8">
          <div className="lg:col-span-2 space-y-6">
              <h1 className="text-4xl font-extrabold tracking-tight">{displayEvent.name}</h1>
              <p className="text-lg text-muted-foreground">{displayEvent.description}</p>
              
              <Card>
                  <CardHeader>
                      <CardTitle>Event Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm">
                      <div className="flex items-start"><Calendar className="mr-3 mt-1 h-5 w-5 shrink-0 text-primary" /><div><p className="font-semibold">Date</p><p className="text-muted-foreground">{format(displayEvent.dateTime, 'EEEE, MMMM do, yyyy')}</p></div></div>
                      <div className="flex items-start"><Clock className="mr-3 mt-1 h-5 w-5 shrink-0 text-primary" /><div><p className="font-semibold">Time</p><p className="text-muted-foreground">{format(displayEvent.dateTime, 'p')}</p></div></div>
                      <div className="flex items-start"><MapPin className="mr-3 mt-1 h-5 w-5 shrink-0 text-primary" /><div><p className="font-semibold">Location</p><p className="text-muted-foreground">{displayEvent.locationName}</p></div></div>
                      <div className="flex items-start"><User className="mr-3 mt-1 h-5 w-5 shrink-0 text-primary" /><div><p className="font-semibold">Organizer</p><p className="text-muted-foreground">{displayEvent.creatorName || 'Anonymous'}</p></div></div>
                  </CardContent>
              </Card>

              <Button onClick={handleNavigateClick} disabled={isNavigating} className="w-full">
                  {isNavigating ? <Loader className="mr-2 h-4 w-4" /> : <Navigation className="mr-2 h-4 w-4" />}
                  {showRoute ? "Recalculate Route" : "Navigate to Event"}
              </Button>
              
              {/* Debug Info Panel */}
              {locationDebugInfo && (
                <Card className="bg-muted/50">
                  <CardHeader>
                    <CardTitle className="text-sm">Location Debug Info</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-xs whitespace-pre-wrap font-mono">{locationDebugInfo}</pre>
                    {userLocation && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        Current: {userLocation.lat.toFixed(6)}, {userLocation.lng.toFixed(6)}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
          </div>
          <div className="lg:col-span-3 h-[400px] lg:h-auto rounded-lg overflow-hidden border">
              <EventMap 
                eventLocation={eventLocation} 
                userLocation={userLocation} 
                showRoute={showRoute}
                interactive={true}
                onLocationSelect={handleManualLocationSet}
              />
              {!showRoute && (
                <p className="text-sm text-muted-foreground text-center mt-2">
                  💡 Tip: Click "Navigate to Event" OR click on the map to manually set your start location
                </p>
              )}
          </div>
        </div>
      </div>
    </>
  );
}

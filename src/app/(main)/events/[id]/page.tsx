
"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';
import { doc, Timestamp } from "firebase/firestore";
import L from "leaflet";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
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
  const firestore = useFirestore();
  const { toast } = useToast();

  console.log(`LOG: Event ID from params: ${id}`);

  const eventDocRef = useMemoFirebase(() => {
    console.log(`LOG: useMemoFirebase running for doc ref with id: ${id}`);
    return id ? doc(firestore, "events", id) : null;
  }, [firestore, id]);

  const { data: event, isLoading: eventLoading, error: eventError } = useDoc<CampusEvent>(eventDocRef);

  useEffect(() => {
    console.log(`LOG: useDoc state change - isLoading: ${eventLoading}, event: ${event ? 'Exists' : 'null'}, error: ${eventError}`);
  }, [event, eventLoading, eventError]);


  const [userLocation, setUserLocation] = useState<L.LatLng | null>(null);
  const [showRoute, setShowRoute] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [permissionDialogOpen, setPermissionDialogOpen] = useState(false);
  const initialLoadComplete = useRef(false);

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
    
    if (!navigator.geolocation || !navigator.permissions) {
      console.error("LOG: Geolocation or permissions API not supported.");
      toast({ variant: "destructive", title: "Geolocation not supported", description: "Your browser does not support geolocation features." });
      setIsNavigating(false);
      return;
    }
    
    const permissionStatus = await navigator.permissions.query({ name: 'geolocation' });
    console.log(`LOG: Geolocation permission status from within requestGeolocation: ${permissionStatus.state}`);

    if (permissionStatus.state === 'denied') {
        console.log("LOG: Permission is denied. Showing toast.");
         toast({ 
             variant: "destructive", 
             title: "Geolocation Denied", 
             description: "You have blocked location access. Please enable it in your browser settings to use navigation." 
         });
         setIsNavigating(false);
         return;
    }

    // This part runs if status is 'granted' or 'prompt'
    setIsNavigating(true);
    console.log("LOG: Calling navigator.geolocation.getCurrentPosition...");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log("LOG: Geolocation success.", position.coords);
        setUserLocation(L.latLng(position.coords.latitude, position.coords.longitude));
        setShowRoute(true);
        toast({ title: "Route Calculated", description: "Showing route from your location." });
        setIsNavigating(false);
      },
      (error) => {
        console.error("LOG: Geolocation error.", error);
        toast({ variant: "destructive", title: "Geolocation error", description: "You denied location access. To use this feature, please enable location permissions in your browser settings." });
        setIsNavigating(false);
      }
    );
  };

  const handleNavigateClick = () => {
    console.log("LOG: handleNavigateClick called.");
    // Directly open the custom dialog to ask for permission first.
    console.log("LOG: Opening permission dialog.");
    setPermissionDialogOpen(true);
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
  const displayEvent = {...event, dateTime: (event.dateTime as unknown as Timestamp).toDate()};

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
          </div>
          <div className="lg:col-span-3 h-[400px] lg:h-auto rounded-lg overflow-hidden border">
              <EventMap eventLocation={eventLocation} userLocation={userLocation} showRoute={showRoute} />
          </div>
        </div>
      </div>
    </>
  );
}


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
  const params = useParams();
  const id = params.id as string;
  const firestore = useFirestore();
  const { toast } = useToast();

  const eventDocRef = useMemoFirebase(() => id ? doc(firestore, "events", id) : null, [firestore, id]);
  const { data: event, isLoading: eventLoading } = useDoc<CampusEvent>(eventDocRef);

  const [userLocation, setUserLocation] = useState<L.LatLng | null>(null);
  const [showRoute, setShowRoute] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [permissionDialogOpen, setPermissionDialogOpen] = useState(false);
  const initialLoadComplete = useRef(false);

  useEffect(() => {
    // This effect should only run once the initial loading is complete.
    // We use a ref to track if the initial load has happened.
    if (eventLoading) {
      return;
    }
    
    // Once isLoading is false, we mark the initial load as complete.
    if (!initialLoadComplete.current) {
        initialLoadComplete.current = true;
    }

    // Now, if the initial load is complete and there's still no event,
    // it means the event truly wasn't found.
    if (initialLoadComplete.current && !event) {
        toast({ variant: "destructive", title: "Error", description: "Event not found." });
    }
  }, [event, eventLoading, toast])


  const requestGeolocation = () => {
    setPermissionDialogOpen(false); // Close the dialog first
    setIsNavigating(true);

    if (!navigator.geolocation) {
      toast({ variant: "destructive", title: "Geolocation not supported", description: "Your browser does not support geolocation." });
      setIsNavigating(false);
      return;
    }

    // This triggers the browser's permission prompt
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation(L.latLng(position.coords.latitude, position.coords.longitude));
        setShowRoute(true);
        toast({ title: "Route Calculated", description: "Showing route from your location." });
        setIsNavigating(false);
      },
      (error) => {
        // This will catch denials from the browser prompt or other errors.
        toast({ variant: "destructive", title: "Geolocation error", description: "You denied location access. To use this feature, please enable location permissions in your browser settings." });
        setIsNavigating(false);
      }
    );
  };

  const handleNavigateClick = async () => {
    if (!navigator.geolocation || !navigator.permissions) {
      toast({ variant: "destructive", title: "Geolocation not supported", description: "Your browser does not support geolocation features." });
      return;
    }
    
    const permissionStatus = await navigator.permissions.query({ name: 'geolocation' });

    if (permissionStatus.state === 'denied') {
        // If permission is already denied, tell the user how to fix it.
         toast({ 
             variant: "destructive", 
             title: "Geolocation Denied", 
             description: "You have blocked location access. Please enable it in your browser settings to use navigation." 
         });
         return;
    }

    // For 'granted' or 'prompt' states, we open our custom dialog first.
    // This provides a consistent, user-friendly experience.
    setPermissionDialogOpen(true);
  };


  if (eventLoading && !initialLoadComplete.current) {
    return <div className="flex h-[calc(100vh-4rem)] items-center justify-center"><Loader className="h-12 w-12" /></div>;
  }

  if (!event) {
    // This message is shown after loading is complete and event is still null.
    // The "Event not found" toast is handled by the useEffect hook.
    return <div className="flex h-[calc(100vh-4rem)] items-center justify-center"><p>Event not found.</p></div>;
  }
  
  const displayEvent = {...event, dateTime: (event.dateTime as unknown as Timestamp).toDate()};

  const eventLocation = L.latLng(displayEvent.location.lat, displayEvent.location.lng);

  return (
    <>
      <AlertDialog open={permissionDialogOpen} onOpenChange={setPermissionDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Location Permission Required</AlertDialogTitle>
            <AlertDialogDescription>
              To show you the route, Campus Connect needs to access your device's location. Please click "Allow" when your browser asks for permission.
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

    
"use client";

import { useState, useEffect } from "react";
import dynamic from 'next/dynamic';
import { doc } from "firebase/firestore";
import L from "leaflet";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { Loader } from "@/components/ui/loader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, MapPin, Navigation, User } from "lucide-react";
import { format } from "date-fns";
import type { CampusEvent, CampusConnectUser } from "@/types";
import { useToast } from "@/hooks/use-toast";

const EventMap = dynamic(() => import('@/components/EventMap'), {
  ssr: false,
  loading: () => <div className="h-full w-full flex items-center justify-center bg-muted rounded-lg"><Loader /></div>,
});


export default function EventDetailsPage({ params }: { params: { id: string } }) {
  const firestore = useFirestore();
  const { toast } = useToast();

  const eventDocRef = useMemoFirebase(() => params.id ? doc(firestore, "events", params.id) : null, [firestore, params.id]);
  const { data: event, isLoading: eventLoading } = useDoc<CampusEvent>(eventDocRef);
  
  const creatorDocRef = useMemoFirebase(() => event?.createdBy ? doc(firestore, "users", event.createdBy) : null, [firestore, event]);
  const { data: creator, isLoading: creatorLoading } = useDoc<CampusConnectUser>(creatorDocRef);

  const [userLocation, setUserLocation] = useState<L.LatLng | null>(null);
  const [showRoute, setShowRoute] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    if (!eventLoading && !event) {
        toast({ variant: "destructive", title: "Error", description: "Event not found." });
    }
  }, [event, eventLoading, toast])


  const handleNavigate = () => {
    setIsNavigating(true);
    if (!navigator.geolocation) {
      toast({ variant: "destructive", title: "Geolocation not supported", description: "Your browser does not support geolocation." });
      setIsNavigating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation(L.latLng(position.coords.latitude, position.coords.longitude));
        setShowRoute(true);
        toast({ title: "Route Calculated", description: "Showing route from your location." });
        setIsNavigating(false);
      },
      (error) => {
        toast({ variant: "destructive", title: "Geolocation error", description: `Could not get your location: ${error.message}` });
        setIsNavigating(false);
      }
    );
  };

  const loading = eventLoading || creatorLoading;

  if (loading) {
    return <div className="flex h-[calc(100vh-4rem)] items-center justify-center"><Loader className="h-12 w-12" /></div>;
  }

  if (!event) {
    return <div className="flex h-[calc(100vh-4rem)] items-center justify-center"><p>Event not found.</p></div>;
  }

  const eventLocation = L.latLng(event.location.lat, event.location.lng);

  return (
    <div className="container py-8">
      <div className="grid lg:grid-cols-5 gap-8">
        <div className="lg:col-span-2 space-y-6">
            <h1 className="text-4xl font-extrabold tracking-tight">{event.name}</h1>
            <p className="text-lg text-muted-foreground">{event.description}</p>
            
            <Card>
                <CardHeader>
                    <CardTitle>Event Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                    <div className="flex items-start"><Calendar className="mr-3 mt-1 h-5 w-5 shrink-0 text-primary" /><div><p className="font-semibold">Date</p><p className="text-muted-foreground">{format(event.dateTime.toDate(), 'EEEE, MMMM do, yyyy')}</p></div></div>
                    <div className="flex items-start"><Clock className="mr-3 mt-1 h-5 w-5 shrink-0 text-primary" /><div><p className="font-semibold">Time</p><p className="text-muted-foreground">{format(event.dateTime.toDate(), 'p')}</p></div></div>
                    <div className="flex items-start"><MapPin className="mr-3 mt-1 h-5 w-5 shrink-0 text-primary" /><div><p className="font-semibold">Location</p><p className="text-muted-foreground">{event.locationName}</p></div></div>
                    <div className="flex items-start"><User className="mr-3 mt-1 h-5 w-5 shrink-0 text-primary" /><div><p className="font-semibold">Organizer</p><p className="text-muted-foreground">{creator?.displayName || 'Anonymous'}</p></div></div>
                </CardContent>
            </Card>

            <Button onClick={handleNavigate} disabled={isNavigating} className="w-full">
                {isNavigating ? <Loader className="mr-2 h-4 w-4" /> : <Navigation className="mr-2 h-4 w-4" />}
                {showRoute ? "Recalculate Route" : "Navigate to Event"}
            </Button>
        </div>
        <div className="lg:col-span-3 h-[400px] lg:h-auto rounded-lg overflow-hidden border">
            <EventMap eventLocation={eventLocation} userLocation={userLocation} showRoute={showRoute} />
        </div>
      </div>
    </div>
  );
}

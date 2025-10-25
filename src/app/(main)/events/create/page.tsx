
"use client";

import { useState } from "react";
import dynamic from 'next/dynamic';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
declare const process: any;
import L from "leaflet";
import { productionConfig } from "@/config/production";

import { useFirestore, useUser, errorEmitter, FirestorePermissionError } from "@/firebase";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Calendar as CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Loader } from "@/components/ui/loader";

const EventMap = dynamic(() => import('@/components/EventMap'), {
  ssr: false,
  loading: () => <div className="h-full w-full flex items-center justify-center bg-muted rounded-lg"><Loader /></div>,
});


const createEventSchema = z.object({
  name: z.string().min(3, "Event name must be at least 3 characters."),
  description: z.string().min(10, "Description must be at least 10 characters."),
  date: z.date({ required_error: "A date is required." }),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)."),
  locationName: z.string().min(3, "Location name is required."),
});

export default function CreateEventPage() {
  const { user: authUser } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<L.LatLng | null>(null);

  const form = useForm<z.infer<typeof createEventSchema>>({
    resolver: zodResolver(createEventSchema),
    defaultValues: { name: "", description: "", time: "18:00", locationName: "" },
  });

  async function onSubmit(values: z.infer<typeof createEventSchema>) {
    if (!selectedLocation) {
      toast({ variant: "destructive", title: "Location missing", description: "Please select a location on the map." });
      return;
    }
    if (!authUser) return;

    setIsLoading(true);

    const [hours, minutes] = values.time.split(':').map(Number);
    const eventDateTime = new Date(values.date);
    eventDateTime.setHours(hours, minutes);

    const eventData = {
      name: values.name,
      description: values.description,
      // send ISO date string to backend; backend should parse into Firestore Timestamp
      dateTime: eventDateTime.toISOString(),
      location: {
        lat: selectedLocation.lat,
        lng: selectedLocation.lng,
      },
      locationName: values.locationName,
      createdBy: authUser.uid,
      creatorName: authUser.displayName || "Anonymous User",
      createdAt: new Date().toISOString(),
    };

      const BACKEND_BASE = productionConfig.backendUrl;
      const url = `${BACKEND_BASE}/api/events`;

    // Try to get an ID token from the user helper if available
    let idToken: string | null = null;
    try {
      // `useUser` may expose a method to get the token; fallback to null.
      // If your useUser hook doesn't provide getIdToken, adjust accordingly.
      // @ts-ignore
      if (authUser?.getIdToken) idToken = await authUser.getIdToken();
    } catch (e) {
      // ignore token retrieval failures; backend will reject unauthorized requests
    }

    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
      },
      body: JSON.stringify(eventData),
    })
      .then(async (res) => {
        if (!res.ok) {
          const permissionError = new FirestorePermissionError({
            path: 'events',
            operation: 'create',
            requestResourceData: eventData,
          });
          errorEmitter.emit('permission-error', permissionError);
          throw new Error('Server error');
        }
        return res.json();
      })
      .then(() => {
        toast({ title: "Success", description: "Event created successfully." });
        router.push("/dashboard");
      })
      .catch(() => {
        // already emitted permission-error above
      })
      .finally(() => {
        setIsLoading(false);
      });
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold tracking-tight mb-8">Create New Event</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem><FormLabel>Event Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea rows={5} {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <div className="grid sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="date" render={({ field }) => (
                <FormItem className="flex flex-col"><FormLabel>Date</FormLabel>
                  <Popover><PopoverTrigger asChild>
                      <FormControl>
                        <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                          {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                  </PopoverContent></Popover><FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="time" render={({ field }) => (
                <FormItem><FormLabel>Time</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
             <FormField control={form.control} name="locationName" render={({ field }) => (
                <FormItem><FormLabel>Location Name</FormLabel><FormControl><Input placeholder="e.g., Main Quad" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
          </div>
          <div className="space-y-2 flex flex-col">
            <FormLabel>Event Location</FormLabel>
            <p className="text-sm text-muted-foreground">Click on the map to set the event location.</p>
            <div className="aspect-video lg:aspect-auto lg:flex-grow rounded-lg overflow-hidden border">
                <EventMap interactive onLocationSelect={setSelectedLocation} selectedLocation={selectedLocation} />
            </div>
          </div>
          <div className="lg:col-span-2">
            <Button type="submit" disabled={isLoading} className="w-full lg:w-auto">
              {isLoading && <Loader className="mr-2 h-4 w-4" />} Create Event
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

    
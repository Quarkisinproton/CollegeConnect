"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { collection, query, orderBy, onSnapshot, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import { Calendar, Clock, MapPin } from "lucide-react";
import type { CampusEvent } from "@/types";
import { format } from 'date-fns';

export default function DashboardPage() {
  const [events, setEvents] = useState<CampusEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "events"), orderBy("dateTime", "asc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const eventsData: CampusEvent[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Filter out past events
        if (data.dateTime.toDate() > new Date()) {
            eventsData.push({ id: doc.id, ...data } as CampusEvent);
        }
      });
      setEvents(eventsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching events: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Upcoming Events</h1>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader className="h-12 w-12" />
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
            <h2 className="text-xl font-semibold">No Upcoming Events</h2>
            <p className="text-muted-foreground mt-2">Check back later for new events on campus!</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <Card key={event.id} className="flex flex-col">
              <CardHeader>
                <CardTitle className="text-xl">{event.name}</CardTitle>
                <CardDescription className="line-clamp-3 h-[60px]">{event.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow flex flex-col justify-between">
                <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center">
                        <Calendar className="mr-2 h-4 w-4" />
                        <span>{format(event.dateTime.toDate(), 'PPP')}</span>
                    </div>
                    <div className="flex items-center">
                        <Clock className="mr-2 h-4 w-4" />
                        <span>{format(event.dateTime.toDate(), 'p')}</span>
                    </div>
                    <div className="flex items-center">
                        <MapPin className="mr-2 h-4 w-4" />
                        <span>{event.locationName}</span>
                    </div>
                </div>
                <Button asChild className="mt-4 w-full">
                  <Link href={`/events/${event.id}`}>View Details</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

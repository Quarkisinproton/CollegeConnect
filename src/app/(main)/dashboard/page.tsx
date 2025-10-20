"use client";

import Link from "next/link";
import { collection, query, orderBy, where, Timestamp } from "firebase/firestore";
import { useFirestore, useCollection, useMemoFirebase, useUser } from "@/firebase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import { Calendar, Clock, MapPin, Edit, Trash2 } from "lucide-react";
import type { CampusEvent } from "@/types";
import { format } from 'date-fns';

type DisplayEvent = Omit<CampusEvent, 'dateTime'> & {
    dateTime: Date;
};

function EventCard({ event }: { event: DisplayEvent }) {
    return (
        <Card key={event.id} className="flex flex-col">
            <CardHeader>
                <CardTitle className="text-xl">{event.name}</CardTitle>
                <CardDescription className="line-clamp-3 h-[60px]">{event.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center">
                    <Calendar className="mr-2 h-4 w-4" />
                    <span>{format(event.dateTime, 'PPP')}</span>
                </div>
                <div className="flex items-center">
                    <Clock className="mr-2 h-4 w-4" />
                    <span>{format(event.dateTime, 'p')}</span>
                </div>
                <div className="flex items-center">
                    <MapPin className="mr-2 h-4 w-4" />
                    <span>{event.locationName}</span>
                </div>
            </CardContent>
            <CardFooter>
                <Button asChild className="w-full">
                    <Link href={`/events/${event.id}`}>View Details</Link>
                </Button>
            </CardFooter>
        </Card>
    );
}


function MyEvents() {
    const firestore = useFirestore();
    const { user } = useUser();

    const myEventsQuery = useMemoFirebase(() =>
        user ? query(
            collection(firestore, "events"),
            where("createdBy", "==", user.uid),
            orderBy("dateTime", "desc")
        ) : null
    , [firestore, user]);

    const { data: myEvents, isLoading: loadingMyEvents } = useCollection<CampusEvent>(myEventsQuery);
    
    const displayMyEvents: DisplayEvent[] | null = myEvents ? myEvents.map(e => ({...e, dateTime: (e.dateTime as unknown as Timestamp).toDate()})) : null;

    if (!user || user.role !== 'president') {
        return null;
    }

    return (
        <div className="mt-12">
            <h2 className="text-2xl font-bold tracking-tight mb-6">My Created Events</h2>
            {loadingMyEvents ? (
                 <div className="flex justify-center items-center h-40">
                    <Loader className="h-10 w-10" />
                </div>
            ) : displayMyEvents && displayMyEvents.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {displayMyEvents.map((event) => (
                        <EventCard event={event} key={event.id}/>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 border-2 border-dashed rounded-lg">
                    <h3 className="text-lg font-semibold">You haven't created any events yet.</h3>
                    <p className="text-muted-foreground mt-1">Click the button below to get started.</p>
                    <Button asChild className="mt-4">
                        <Link href="/events/create">Create Your First Event</Link>
                    </Button>
                </div>
            )}
        </div>
    )
}


export default function DashboardPage() {
  const firestore = useFirestore();

  const eventsQuery = useMemoFirebase(() => 
    query(collection(firestore, "events"), orderBy("dateTime", "asc"))
  , [firestore]);
  
  const { data: events, isLoading: loading } = useCollection<CampusEvent>(eventsQuery);

  const upcomingEvents: DisplayEvent[] = events
      ? events
          .map(event => ({...event, dateTime: (event.dateTime as unknown as Timestamp).toDate()}))
          .filter(event => event.dateTime > new Date())
      : [];

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Upcoming Events</h1>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader className="h-12 w-12" />
        </div>
      ) : upcomingEvents.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
            <h2 className="text-xl font-semibold">No Upcoming Events</h2>
            <p className="text-muted-foreground mt-2">Check back later for new events on campus!</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {upcomingEvents.map((event) => (
            <EventCard event={event} key={event.id}/>
          ))}
        </div>
      )}
      <MyEvents />
    </div>
  );
}

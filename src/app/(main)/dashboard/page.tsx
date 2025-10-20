"use client";

import Link from "next/link";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, Timestamp } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import { format } from "date-fns";
import type { CampusEvent } from "@/types";

function EventList() {
  const firestore = useFirestore();
  const eventsQuery = useMemoFirebase(() => query(collection(firestore, "events"), orderBy("dateTime", "asc")), [firestore]);
  const { data: events, isLoading, error } = useCollection<CampusEvent>(eventsQuery);
  const { user } = useUser();

  if (isLoading) {
    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="flex flex-col">
            <CardHeader>
              <div className="h-6 bg-muted rounded w-3/4 animate-pulse"></div>
              <div className="h-4 bg-muted rounded w-1/2 mt-2 animate-pulse"></div>
            </CardHeader>
            <CardContent className="flex-grow">
               <div className="h-4 bg-muted rounded w-full animate-pulse mb-2"></div>
               <div className="h-4 bg-muted rounded w-full animate-pulse"></div>
            </CardContent>
            <CardFooter>
                <div className="h-10 bg-muted rounded w-24 animate-pulse"></div>
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    // The error is thrown by the FirebaseErrorListener, so we don't need to render a message here.
    // We can return a loader or a fallback UI.
    return <div className="text-center py-16 border-2 border-dashed rounded-lg bg-destructive/10 border-destructive/50">
        <h2 className="text-xl font-semibold text-destructive">Error Loading Events</h2>
        <p className="text-muted-foreground mt-2">There was a permission error. The detailed error should be visible in the development overlay.</p>
    </div>;
  }
  
  if (!events || events.length === 0) {
     return (
       <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <h2 className="text-xl font-semibold">No Upcoming Events</h2>
          <p className="text-muted-foreground mt-2">
            There are currently no events scheduled. Check back later!
          </p>
      </div>
     )
  }

  // Normalize dateTime to JS Date and then, for presidents, split into "My Events" and "Upcoming Events"
  const normalized = events.map((event) => {
    const dt = (event as any).dateTime;
    let dateObj: Date;
    if (dt instanceof Timestamp) dateObj = dt.toDate();
    else if (typeof dt === 'string') dateObj = new Date(dt);
    else dateObj = new Date();
    return { ...event, dateTime: dateObj };
  });

  if (user?.role === 'president') {
    const myEvents = normalized.filter((e) => (e as any).createdBy === user.uid);
    const otherUpcoming = normalized.filter((e) => (e as any).createdBy !== user.uid);

    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-semibold mb-4">My Events</h2>
          {myEvents.length === 0 ? (
            <div className="text-muted-foreground">You haven't published any events yet.</div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myEvents.map((event) => (
                <Card key={event.id} className="flex flex-col">
                  <CardHeader>
                    <CardTitle className="truncate">{event.name}</CardTitle>
                    <CardDescription>{format(event.dateTime, "EEEE, MMMM do, yyyy 'at' p")}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <p className="line-clamp-3 text-sm text-muted-foreground">{event.description}</p>
                  </CardContent>
                  <CardFooter>
                    <Button asChild size="sm">
                      <Link href={`/events/${event.id}`}>View Details</Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-4">Upcoming Events</h2>
          {otherUpcoming.length === 0 ? (
            <div className="text-muted-foreground">No upcoming events from other organizers.</div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {otherUpcoming.map((event) => (
                <Card key={event.id} className="flex flex-col">
                  <CardHeader>
                    <CardTitle className="truncate">{event.name}</CardTitle>
                    <CardDescription>{format(event.dateTime, "EEEE, MMMM do, yyyy 'at' p")}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <p className="line-clamp-3 text-sm text-muted-foreground">{event.description}</p>
                  </CardContent>
                  <CardFooter>
                    <Button asChild size="sm">
                      <Link href={`/events/${event.id}`}>View Details</Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Default (student) view: show all normalized events
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {normalized.map((event) => (
        <Card key={event.id} className="flex flex-col">
          <CardHeader>
            <CardTitle className="truncate">{event.name}</CardTitle>
            <CardDescription>{format(event.dateTime, "EEEE, MMMM do, yyyy 'at' p")}</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            <p className="line-clamp-3 text-sm text-muted-foreground">{event.description}</p>
          </CardContent>
          <CardFooter>
            <Button asChild size="sm">
              <Link href={`/events/${event.id}`}>View Details</Link>
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}


export default function DashboardPage() {
  const { user } = useUser();

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          {user?.role === 'president' ? "Event Management" : "Campus Events"}
        </h1>
      </div>

      <EventList />
    </div>
  );
}

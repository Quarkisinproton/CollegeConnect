"use client";

import Link from "next/link";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, Timestamp } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import { PageHeader } from "@/components/PageHeader";
import { format } from "date-fns";
import type { CampusEvent } from "@/types";
type DisplayEvent = Omit<CampusEvent, 'dateTime'> & { dateTime: Date };

function EventList() {
  const firestore = useFirestore();
  const eventsQuery = useMemoFirebase(() => query(collection(firestore, "events"), orderBy("dateTime", "asc")), [firestore]);
  const { data: events, isLoading, error } = useCollection<CampusEvent>(eventsQuery);

  // Helper to normalize a Timestamp | Date | string to a Date instance
  const toDate = (dt: Date | Timestamp | string | undefined): Date => {
    if (!dt) return new Date();
    if (dt instanceof Timestamp) return dt.toDate();
    if (dt instanceof Date) return dt;
    return new Date(dt as any);
  };

  if (isLoading) {
    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="flex flex-col shadow-soft rounded-lg bg-card/60 backdrop-blur animate-pulse">
            <CardHeader>
              <div className="h-6 bg-muted rounded w-3/4"></div>
              <div className="h-4 bg-muted rounded w-1/2 mt-2"></div>
            </CardHeader>
            <CardContent className="flex-grow">
               <div className="h-4 bg-muted rounded w-full mb-2"></div>
               <div className="h-4 bg-muted rounded w-full"></div>
            </CardContent>
            <CardFooter>
                <div className="h-10 bg-muted rounded w-24"></div>
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
  const normalized = (events || []).map((event) => {
    const dt = (event as any).dateTime;
    let dateObj: Date;
    if (dt instanceof Timestamp) dateObj = dt.toDate();
    else if (typeof dt === 'string') dateObj = new Date(dt);
    else dateObj = new Date();
    return { ...event, dateTime: dateObj };
  }) as DisplayEvent[];

  // Presidents and students see the same list now: all events from Firestore
  // Removed "My Events" section to avoid backend auth requirements

  // Default (student) view: show all normalized events
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {normalized.map((event, idx) => (
        <Card 
          key={event.id} 
          className="flex flex-col shadow-soft rounded-lg bg-card/60 backdrop-blur transition-all duration-200 hover:shadow-elevated hover:scale-[1.02] animate-slide-up-fade"
          style={{ animationDelay: `${idx * 50}ms` }}
        >
            <CardHeader>
            <CardTitle className="truncate">{event.name}</CardTitle>
            <CardDescription>{format(toDate(event.dateTime as any), "EEEE, MMMM do, yyyy 'at' p")}</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            <p className="line-clamp-3 text-sm text-muted-foreground">{event.description}</p>
          </CardContent>
          <CardFooter>
            <Button asChild size="sm" className="transition-all duration-200">
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
    <div>
      <PageHeader
        title={user?.role === 'president' ? "Event Management" : "Campus Events"}
        description={user?.role === 'president' ? "Manage and create events for your club" : "Discover and navigate to campus events"}
      />
      <EventList />
    </div>
  );
}

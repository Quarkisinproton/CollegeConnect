"use client";

import Link from "next/link";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { useEffect, useState } from "react";
import { collection, query, orderBy, Timestamp } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import { format } from "date-fns";
import { productionConfig } from "@/config/production";
import type { CampusEvent } from "@/types";
type DisplayEvent = Omit<CampusEvent, 'dateTime'> & { dateTime: Date };

function EventList() {
  const firestore = useFirestore();
  const eventsQuery = useMemoFirebase(() => query(collection(firestore, "events"), orderBy("dateTime", "asc")), [firestore]);
  const { data: events, isLoading, error } = useCollection<CampusEvent>(eventsQuery);
  const { user } = useUser();
  const [ownedEvents, setOwnedEvents] = useState<DisplayEvent[] | null>(null);
  const [ownedLoading, setOwnedLoading] = useState(false);
  const [ownedError, setOwnedError] = useState<string | null>(null);
  // Use the same backend base resolution as other pages/components
  const BACKEND_BASE = productionConfig.backendUrl;

  // Helper to normalize a Timestamp | Date | string to a Date instance
  const toDate = (dt: Date | Timestamp | string | undefined): Date => {
    if (!dt) return new Date();
    if (dt instanceof Timestamp) return dt.toDate();
    if (dt instanceof Date) return dt;
    return new Date(dt as any);
  };

  // Fetch owned events when the user is a president. Keep hook unconditional.
  useEffect(() => {
    let active = true;
    if (!user?.uid || user?.role !== 'president') return;
    setOwnedLoading(true);
    setOwnedError(null);
    const headers: Record<string,string> = { 'Accept': 'application/json' };
    // attach ID token when available
    (async () => {
      try {
        // @ts-ignore
        if (user?.getIdToken) {
          // @ts-ignore
          const token = await user.getIdToken();
          if (token) headers['Authorization'] = `Bearer ${token}`;
        }
      } catch (e) {
        // ignore
      }
      fetch(`${BACKEND_BASE}/api/events?owner=true`, { method: 'GET', headers })
      .then(async (res) => {
        if (!res.ok) {
          // Avoid dumping HTML error pages in the UI
          const contentType = res.headers.get('content-type') || '';
          const txt = await res.text();
          if (contentType.includes('text/html') || (txt && txt.trim().startsWith('<'))) {
            throw new Error(`Request failed (${res.status}). Check backend URL configuration.`);
          }
          throw new Error(txt || 'server error');
        }
        return res.json();
      })
      .then((json: CampusEvent[]) => {
        if (!active) return;
  // Convert dateTime ISO strings to Dates
  const mapped = (json || []).map((ev) => ({ ...ev, dateTime: ev.dateTime ? new Date(ev.dateTime as any) : new Date() })) as DisplayEvent[];
  setOwnedEvents(mapped);
      })
      .catch((err) => {
        if (!active) return;
        setOwnedError(err.message || 'Failed to load owned events');
      })
      .finally(() => { if (active) setOwnedLoading(false); });
    })();

    return () => { active = false; };
  }, [user?.uid, user?.role]);

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
  const normalized = (events || []).map((event) => {
    const dt = (event as any).dateTime;
    let dateObj: Date;
    if (dt instanceof Timestamp) dateObj = dt.toDate();
    else if (typeof dt === 'string') dateObj = new Date(dt);
    else dateObj = new Date();
    return { ...event, dateTime: dateObj };
  }) as DisplayEvent[];

  if (user?.role === 'president') {
    // Use owned events from the backend fetch above
    const myEvents = ownedEvents ?? normalized.filter((e) => (e as any).createdBy === user.uid);
  const otherUpcoming = normalized.filter((e) => (e as any).createdBy !== user.uid);

    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-semibold mb-4">My Events</h2>
          {ownedLoading ? (
            <div className="text-muted-foreground">Loading your events…</div>
          ) : ownedError ? (
            <div className="text-destructive">Error loading your events: {ownedError}</div>
          ) : myEvents.length === 0 ? (
            <div className="text-muted-foreground">You haven't published any events yet.</div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myEvents.map((event) => (
                <Card key={event.id} className="flex flex-col">
                  <CardHeader>
                    <CardTitle className="truncate">{event.name}</CardTitle>
                    <CardDescription>{format(toDate(event.dateTime as any), "EEEE, MMMM do, yyyy 'at' p")}</CardDescription>
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
                    <CardDescription>{format(toDate(event.dateTime as any), "EEEE, MMMM do, yyyy 'at' p")}</CardDescription>
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
            <CardDescription>{format(toDate(event.dateTime as any), "EEEE, MMMM do, yyyy 'at' p")}</CardDescription>
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

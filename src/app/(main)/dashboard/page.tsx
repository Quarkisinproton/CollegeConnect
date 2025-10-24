"use client";

import Link from "next/link";
import { useUser } from "@/firebase";
import { useEffect, useState } from "react";
import { Timestamp } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import { format } from "date-fns";
import type { CampusEvent } from "@/types";
import { productionConfig } from "@/config/production";

type DisplayEvent = Omit<CampusEvent, 'dateTime'> & { dateTime: Date };

const BACKEND_BASE = process.env.NODE_ENV === 'production' 
  ? productionConfig.backendUrl 
  : (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8081');

function EventList() {
  const { user } = useUser();
  const [events, setEvents] = useState<DisplayEvent[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  console.log('[Dashboard] EventList render:', { 
    isLoading, 
    error, 
    eventsCount: events?.length,
    userRole: user?.role,
    userId: user?.uid
  });

  const [ownedEvents, setOwnedEvents] = useState<DisplayEvent[] | null>(null);
  const [ownedLoading, setOwnedLoading] = useState(false);
  const [ownedError, setOwnedError] = useState<string | null>(null);

  // Helper to normalize a Timestamp | Date | string to a Date instance
  const toDate = (dt: Date | Timestamp | string | undefined): Date => {
    if (!dt) return new Date();
    if (dt instanceof Timestamp) return dt.toDate();
    if (dt instanceof Date) return dt;
    return new Date(dt as any);
  };

  // Fetch all events from backend API
  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setError(null);

    const headers: Record<string, string> = { 'Accept': 'application/json' };
    
    (async () => {
      try {
        // Try to get ID token if available
        // @ts-ignore
        if (user?.getIdToken) {
          // @ts-ignore
          const token = await user.getIdToken();
          if (token) headers['Authorization'] = `Bearer ${token}`;
        }
      } catch (e) {
        // ignore
      }

      fetch(`${BACKEND_BASE}/api/events`, { method: 'GET', headers })
        .then(async (res) => {
          if (!res.ok) {
            const txt = await res.text();
            throw new Error(txt || 'Failed to load events');
          }
          return res.json();
        })
        .then((json: CampusEvent[]) => {
          if (!active) return;
          // Convert dateTime ISO strings to Dates
          const mapped = (json || []).map((ev) => ({ 
            ...ev, 
            dateTime: ev.dateTime ? new Date(ev.dateTime as any) : new Date() 
          })) as DisplayEvent[];
          console.log('[Dashboard] Events fetched from backend:', mapped.length);
          setEvents(mapped);
        })
        .catch((err) => {
          if (!active) return;
          console.error('[Dashboard] Error fetching events:', err);
          setError(err.message || 'Failed to load events');
        })
        .finally(() => { 
          if (active) setIsLoading(false); 
        });
    })();

    return () => { active = false; };
  }, [user?.uid]);

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
  // In local emulator mode the backend allows passing uid explicitly
  // so that we can filter without requiring Firebase Admin token verification.
  fetch(`${BACKEND_BASE}/api/events?owner=true&uid=${user.uid}`, { method: 'GET', headers })
      .then(async (res) => {
        if (!res.ok) {
          const txt = await res.text();
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
    return <div className="text-center py-16 border-2 border-dashed rounded-lg bg-destructive/10 border-destructive/50">
        <h2 className="text-xl font-semibold text-destructive">Error Loading Events</h2>
        <p className="text-muted-foreground mt-2">{error}</p>
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

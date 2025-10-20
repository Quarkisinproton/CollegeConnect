"use client";

import { useUser } from "@/firebase";

export default function DashboardPage() {
  const { user } = useUser();

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          {user?.role === 'president' ? "Event Management" : "Campus Events"}
        </h1>
      </div>

       <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <h2 className="text-xl font-semibold">Welcome to Campus Connect!</h2>
          <p className="text-muted-foreground mt-2">
            {user?.role === 'president' 
              ? "Use the 'Create Event' button to get started." 
              : "There are currently no events scheduled. Check back later!"}
          </p>
      </div>
    </div>
  );
}

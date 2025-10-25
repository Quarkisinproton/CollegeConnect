"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader } from "@/components/ui/loader";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Always land on the login page first; dashboard is accessible after login
    router.replace("/login");
  }, [router]);

  return (
    <div className="flex h-screen w-full items-center justify-center">
      <Loader className="h-12 w-12" />
    </div>
  );
}

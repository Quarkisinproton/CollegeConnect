"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, initiateAnonymousSignIn } from "@/firebase";
import { Loader } from "@/components/ui/loader";
import { useToast } from "@/hooks/use-toast";
import { onAuthStateChanged } from "firebase/auth";

export default function LoginPage() {
  const router = useRouter();
  const auth = useAuth();
  const { toast } = useToast();
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    if (isSigningIn || auth.currentUser) return;
  
    setIsSigningIn(true);
    initiateAnonymousSignIn(auth)
      .catch((error: any) => {
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: error.message || "An unexpected error occurred during sign-in.",
        });
        setIsSigningIn(false);
      });
  
  }, [auth, toast, isSigningIn]);
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.push("/dashboard");
      }
    });

    return () => unsubscribe();
  }, [auth, router]);

  return (
    <div className="flex h-screen w-full items-center justify-center">
      <Loader className="h-12 w-12" />
      <p className="ml-4 text-lg">Signing in...</p>
    </div>
  );
}

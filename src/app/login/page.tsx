"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth, initiateAnonymousSignIn, setDocumentNonBlocking } from "@/firebase";
import { doc, serverTimestamp } from "firebase/firestore";
import { useFirestore } from "@/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader } from "@/components/ui/loader";
import { User, Building } from "lucide-react";

type Role = 'student' | 'president';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState<Role | null>(null);

  const handleLogin = async (role: Role) => {
    setIsLoading(role);
    try {
      const userCredential = await initiateAnonymousSignIn(auth);
      const user = userCredential.user;

      const userDocRef = doc(firestore, "users", user.uid);
      const userData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || "Anonymous User",
        role: role,
        createdAt: serverTimestamp(),
      };
      
      // We are explicitly setting the document here upon login.
      await setDoc(userDocRef, userData, { merge: true });

      toast({
        title: "Login Successful",
        description: `You are now logged in as a ${role}.`,
      });
      
      const redirectPath = searchParams.get('redirect') || '/dashboard';
      router.push(redirectPath);

    } catch (error: any) {
      console.error("Login failed:", error);
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.message || "An unexpected error occurred during sign-in.",
      });
      setIsLoading(null);
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-100 dark:bg-gray-900">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
            <div className="flex justify-center items-center mb-4">
                <Building className="h-8 w-8 text-primary" />
            </div>
          <CardTitle className="text-3xl font-bold">Welcome to Campus Connect</CardTitle>
          <CardDescription className="text-muted-foreground">Please select your role to continue</CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          <div className="grid grid-cols-1 gap-6">
            <Button
              size="lg"
              className="h-16 text-lg"
              onClick={() => handleLogin('student')}
              disabled={!!isLoading}
            >
              {isLoading === 'student' ? (
                <Loader className="mr-2" />
              ) : (
                <User className="mr-2" />
              )}
              I am a Student
            </Button>
            <Button
              size="lg"
              variant="secondary"
              className="h-16 text-lg"
              onClick={() => handleLogin('president')}
              disabled={!!isLoading}
            >
              {isLoading === 'president' ? (
                <Loader className="mr-2" />
              ) : (
                <User className="mr-2" />
              )}
              I am a Club President
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

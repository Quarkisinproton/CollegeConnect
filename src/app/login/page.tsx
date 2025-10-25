"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth, initiateAnonymousSignIn, useFirestore } from "@/firebase";
import { signOut } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader } from "@/components/ui/loader";
import { Building, User, Users } from "lucide-react";
import type { CampusConnectUser } from "@/types";
import { productionConfig } from "@/config/production";

type PredefinedUser = Omit<CampusConnectUser, 'createdAt' | 'uid' | 'email'>;

const students: PredefinedUser[] = [
    { displayName: "Stud1", role: "student" },
    { displayName: "Stud2", role: "student" },
    { displayName: "Stud3", role: "student" },
    { displayName: "Stud4", role: "student" },
];

const presidents: PredefinedUser[] = [
    { displayName: "Club1", role: "president" },
    { displayName: "Club2", role: "president" },
    { displayName: "Club3", role: "president" },
    { displayName: "Club4", role: "president" },
]

function LoginPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const auth = useAuth();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState<string | null>(null);

    const handleLogin = async (userProfile: PredefinedUser) => {
        setIsLoading(userProfile.displayName);
        try {
            // Sign out any existing user first to ensure clean state
            if (auth.currentUser) {
                await signOut(auth);
            }
            
            const userCredential = await initiateAnonymousSignIn(auth);
            const user = userCredential.user;

            const userData = {
                uid: user.uid,
                email: user.email,
                displayName: userProfile.displayName,
                role: userProfile.role,
                createdAt: new Date().toISOString(),
            };

            // Always use production backend URL in deployed environment
            const BACKEND_BASE = productionConfig.backendUrl;
            const url = `${BACKEND_BASE}/api/users/${user.uid}`;

            console.log('[Login] Backend URL:', BACKEND_BASE);
            console.log('[Login] Saving user profile to:', url, userData);

            // try to get id token if available
            let idToken = null;
            try {
                // @ts-ignore
                if (user?.getIdToken) idToken = await user.getIdToken();
            } catch (e) {
                console.log('[Login] Could not get ID token:', e);
            }

            console.log('[Login] Sending PUT request to backend...');
            const res = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
                },
                body: JSON.stringify(userData),
            });

            console.log('[Login] Backend response status:', res.status);

            if (!res.ok) {
                const errorText = await res.text();
                console.error('Backend error:', errorText);
                throw new Error(`Failed to write user profile: ${res.status} ${errorText}`);
            }

            const savedUser = await res.json();
            console.log('User profile saved successfully:', savedUser);

            toast({
                title: "Login Successful",
                description: `You are now logged in as ${userProfile.displayName}.`,
            });

            // clear loading state before navigation to avoid UI glitches
            setIsLoading(null);
            const redirectPath = searchParams.get('redirect') || '/dashboard';
            // Force a hard navigation to ensure the user context is refreshed with the new profile
            window.location.href = redirectPath;

        } catch (error: any) {
            console.error("[Login] Authentication or backend operation failed:", error);
            
            // Better error messages
            let errorMessage = "An unexpected error occurred during sign-in.";
            if (error.message?.includes('Failed to fetch')) {
                errorMessage = "Cannot connect to backend server. It may be starting up (takes ~1 minute on first request).";
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            toast({
                variant: "destructive",
                title: "Login Failed",
                description: errorMessage,
            });
            setIsLoading(null);
        }
    };

    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
            <Card className="w-full max-w-2xl shadow-2xl">
                <CardHeader className="text-center">
                    <div className="flex justify-center items-center mb-4">
                        <Building className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-3xl font-bold">Welcome to Campus Connect</CardTitle>
                    <CardDescription className="text-muted-foreground">Please select a user profile to log in</CardDescription>
                </CardHeader>
                <CardContent className="grid sm:grid-cols-2 gap-8 px-8">
                    <div>
                        <h3 className="text-lg font-semibold mb-4 flex items-center"><Users className="mr-2 h-5 w-5"/>Students</h3>
                        <div className="flex flex-col gap-3">
                            {students.map(student => (
                                <Button
                                    key={student.displayName}
                                    variant="outline"
                                    className="w-full justify-start h-12 text-base"
                                    onClick={() => handleLogin(student)}
                                    disabled={!!isLoading}
                                >
                                    {isLoading === student.displayName ? <Loader className="mr-2"/> : <User className="mr-2" />}
                                    {student.displayName}
                                </Button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold mb-4 flex items-center"><Users className="mr-2 h-5 w-5"/>Club Presidents</h3>
                        <div className="flex flex-col gap-3">
                            {presidents.map(president => (
                                <Button
                                    key={president.displayName}
                                    variant="secondary"
                                    className="w-full justify-start h-12 text-base"
                                    onClick={() => handleLogin(president)}
                                    disabled={!!isLoading}
                                >
                                    {isLoading === president.displayName ? <Loader className="mr-2"/> : <User className="mr-2" />}
                                    {president.displayName}
                                </Button>
                            ))}
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="p-8 mt-4">
                    <p className="text-xs text-muted-foreground text-center w-full">
                        This is a simulated login. Selecting a user will create a temporary anonymous account with the chosen role and name.
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="flex min-h-screen w-full items-center justify-center"><Loader /></div>}>
            <LoginPageContent />
        </Suspense>
    );
}

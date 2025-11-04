"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth, initiateAnonymousSignIn, useFirestore } from "@/firebase";
import { signOut } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader } from "@/components/ui/loader";
import { Building } from "lucide-react";
import type { CampusConnectUser } from "@/types";
import { productionConfig } from "@/config/production";

function LoginPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const auth = useAuth();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState<"student" | "president">("student");

    const handleLogin = async () => {
        setIsLoading(true);
        try {
            // Sign out any existing user first to ensure clean state
            if (auth.currentUser) {
                await signOut(auth);
            }
            
            const userCredential = await initiateAnonymousSignIn(auth);
            const user = userCredential.user;
            const displayName = email?.trim() ? email.split("@")[0] : (role === "student" ? "Student" : "Club");
            const userData = {
                uid: user.uid,
                email: user.email,
                displayName,
                role,
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
                description: `You are now logged in as ${displayName}.`,
            });

            // clear loading state before navigation to avoid UI glitches
            setIsLoading(false);
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
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen w-full items-center justify-center p-4">
            <Card className="w-full max-w-lg glass-card glass-hover animate-slide-up-fade">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Building className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-3xl font-bold">Welcome to Campus Connect</CardTitle>
                    <CardDescription className="text-muted-foreground">Please enter your details to continue</CardDescription>
                </CardHeader>
                <CardContent className="px-6">
                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="user@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                autoComplete="off"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete="off"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Role</Label>
                            <Select value={role} onValueChange={(v) => setRole(v as any)}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="student">Student</SelectItem>
                                    <SelectItem value="president">Club</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Button onClick={handleLogin} disabled={isLoading} className="mt-2">
                            {isLoading ? <Loader className="mr-2" /> : null}
                            Login
                        </Button>
                    </div>
                </CardContent>
                <CardFooter className="px-6 pb-6">
                    <p className="text-xs text-muted-foreground text-center w-full">
                        This is a simulated login. Email and password are placeholders; clicking Login creates a temporary account with the selected role.
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

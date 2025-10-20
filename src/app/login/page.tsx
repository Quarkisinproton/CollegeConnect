"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth, initiateAnonymousSignIn, useFirestore } from "@/firebase";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader } from "@/components/ui/loader";
import { Building, User, Users } from "lucide-react";
import type { CampusConnectUser } from "@/types";

type PredefinedUser = Omit<CampusConnectUser, 'createdAt' | 'uid' | 'email'>;

const students: PredefinedUser[] = [
    { displayName: "Alex Johnson", role: "student" },
    { displayName: "Brenda Smith", role: "student" },
    { displayName: "Charlie Brown", role: "student" },
    { displayName: "Diana Prince", role: "student" },
];

const presidents: PredefinedUser[] = [
    { displayName: "Edward King", role: "president" },
    { displayName: "Fiona Queen", role: "president" },
    { displayName: "George Lord", role: "president" },
    { displayName: "Helen Duke", role: "president" },
]

export default function LoginPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const auth = useAuth();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState<string | null>(null);

    const handleLogin = async (userProfile: PredefinedUser) => {
        setIsLoading(userProfile.displayName);
        try {
            const userCredential = await initiateAnonymousSignIn(auth);
            const user = userCredential.user;

            const userDocRef = doc(firestore, "users", user.uid);
            const userData = {
                uid: user.uid,
                email: user.email,
                displayName: userProfile.displayName,
                role: userProfile.role,
                createdAt: serverTimestamp(),
            };

            await setDoc(userDocRef, userData, { merge: true });

            toast({
                title: "Login Successful",
                description: `You are now logged in as ${userProfile.displayName}.`,
            });
            
            const redirectPath = searchParams.get('redirect') || '/dashboard';
            router.push(redirectPath);

        } catch (error: any) {
            console.error("Authentication or Firestore operation failed:", error);
            toast({
                variant: "destructive",
                title: "Login Failed",
                description: error.message || "An unexpected error occurred during sign-in.",
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

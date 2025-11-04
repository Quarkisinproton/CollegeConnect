"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building, LogOut, PlusCircle, User as UserIcon } from "lucide-react";
import { signOut } from "firebase/auth";
import { useAuth, useUser } from "@/firebase";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import ThemeToggle from "@/components/ThemeToggle";

export default function Header() {
  const { user } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/login");
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Logout Failed",
        description: "There was an error logging out. Please try again.",
      });
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b glass-card">
      <div className="mx-auto flex h-16 max-w-7xl items-center px-4 md:px-6 lg:px-8">
        <Link href="/dashboard" className="mr-6 flex items-center gap-2">
          <Building className="h-6 w-6 text-primary" />
          <span className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-base font-semibold text-transparent">
            Campus Connect
          </span>
        </Link>
        <div className="flex flex-1 items-center justify-end gap-2">
          <nav className="flex items-center gap-2">
            {user?.role === 'president' && (
              <Button asChild className="shadow-soft">
                <Link href="/events/create">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Event
                </Link>
              </Button>
            )}
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback>
                      <UserIcon />
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user?.displayName || "Anonymous User"}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.uid}
                    </p>
                     <p className="text-xs leading-none text-muted-foreground capitalize pt-1">
                      Role: {user?.role}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>
        </div>
      </div>
    </header>
  );
}


"use client";

import Link from "next/link";
import { LogIn, LogOut, User as UserIcon } from "lucide-react"; // Added UserIcon
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/icons/Logo";
import { createClient } from "@/lib/supabase/client";
import { useRouter, usePathname } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggleButton } from "@/components/theme/ThemeToggleButton";
import { cn } from "@/lib/utils";

async function handleLogout(router: ReturnType<typeof useRouter>) {
  const supabase = createClient();
  await supabase.auth.signOut();
  router.push("/");
  router.refresh();
}

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    const fetchUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (!error) {
        setUser(data.user);
      }
      setLoading(false);
    };

    fetchUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const userEmail = user?.email;
  const emailInitial = userEmail ? userEmail.charAt(0).toUpperCase() : "?";

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-18 items-center justify-between">
        {/* Left Section: Logo + Dashboard */}
        <div className="flex items-center space-x-6 ml-4">
          <Link href="/" className="flex items-center space-x-2">
            <Logo />
          </Link>

          {user && (
            <Link
              href="/dashboard"
              className={cn(
                "text-lg font-medium transition-colors hover:text-foreground",
                pathname === "/dashboard"
                  ? "text-primary font-semibold"
                  : "text-foreground/70"
              )}
            >
              Dashboard
            </Link>
          )}
        </div>

        {/* Right Section: Toggle + Avatar/Login */}
        <div className="flex items-center space-x-4 mr-4">
          <ThemeToggleButton /> {/* Removed className, will take default size */}

          {!loading && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="group h-12 w-12 rounded-full" // Increased button size for larger avatar
                >
                  <Avatar className="h-10 w-10"> {/* Increased Avatar size */}
                    <AvatarImage
                      src={user.user_metadata?.avatar_url}
                      alt={userEmail || "User"}
                    />
                    <AvatarFallback className="text-xl group-hover:text-primary"> {/* Increased fallback text size */}
                      {emailInitial}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user.user_metadata?.full_name || userEmail}
                    </p>
                    {userEmail && (
                      <p className="text-xs leading-none text-muted-foreground">
                        {userEmail}
                      </p>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/profile')}>
                  <UserIcon className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleLogout(router)}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild>
              <Link href="/login" className="text-lg">
                <LogIn className="mr-2 h-4 w-4" /> Login
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

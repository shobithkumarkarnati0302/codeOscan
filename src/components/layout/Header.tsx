
"use client";

import Link from "next/link";
import { LogIn, LogOut, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/icons/Logo";
import { createClient } from "@/lib/supabase/client";
import { useRouter, usePathname } from "next/navigation"; // Added usePathname
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
import { cn } from "@/lib/utils"; // Added cn import

async function handleLogout(router: ReturnType<typeof useRouter>) {
  const supabase = createClient();
  await supabase.auth.signOut();
  router.push("/");
  router.refresh(); // Important to re-render server components
}

export function Header() {
  const router = useRouter();
  const pathname = usePathname(); // Get current pathname
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
      <div className="container flex h-18 items-center"> {/* Changed h-16 to h-18 */}
        <Link href="/" className="mr-8 flex items-center space-x-2"> {/* Changed mr-6 to mr-8 */}
          <Logo />
        </Link>
        <nav className="flex flex-1 items-center space-x-4">
          {user && (
            <Link
              href="/dashboard"
              className={cn(
                "text-lg font-medium transition-colors hover:text-foreground", // Changed text-base to text-lg
                pathname === "/dashboard"
                  ? "text-primary font-semibold"
                  : "text-foreground/70"
              )}
            >
              Dashboard
            </Link>
          )}
        </nav>
        <div className="flex items-center space-x-2">
          <ThemeToggleButton />
          {loading ? null : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.user_metadata?.avatar_url} alt={userEmail || "User"} />
                    <AvatarFallback>{emailInitial}</AvatarFallback>
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
                <DropdownMenuItem onClick={() => handleLogout(router)}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild>
              <Link href="/login" className="text-lg"> {/* Changed text-base to text-lg */}
                <LogIn className="mr-2 h-4 w-4" /> Login
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

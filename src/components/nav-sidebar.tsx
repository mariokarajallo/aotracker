"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Users, Package, FileText, LogOut } from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/customers", label: "Clientas", icon: Users },
  { href: "/catalog", label: "Catálogo", icon: Package },
  { href: "/orders", label: "Notas", icon: FileText },
];

export function NavSidebar() {
  const pathname = usePathname();
  const { signOut } = useClerk();

  function isActive(href: string) {
    return href === "/" ? pathname === "/" : pathname.startsWith(href);
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 border-r bg-background h-screen sticky top-0 shrink-0">
        <div className="p-4 border-b">
          <h1 className="font-bold text-lg">aotracker</h1>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive(href)
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-muted-foreground"
            onClick={() => signOut({ redirectUrl: "/sign-in" })}
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </Button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 border-b bg-background sticky top-0 z-10">
        <h1 className="font-bold text-lg">aotracker</h1>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground text-xs gap-1"
          onClick={() => signOut({ redirectUrl: "/sign-in" })}
        >
          <LogOut className="h-3.5 w-3.5" />
          Salir
        </Button>
      </header>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-10 bg-background border-t flex">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-xs transition-colors",
              isActive(href)
                ? "text-primary"
                : "text-muted-foreground"
            )}
          >
            <Icon className={cn("h-5 w-5", isActive(href) && "stroke-[2.5]")} />
            {label}
          </Link>
        ))}
      </nav>
    </>
  );
}

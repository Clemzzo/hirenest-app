"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Home, Users, MessageCircle, Briefcase, Settings as SettingsIcon, Menu, X } from "lucide-react";
import hireLogo from "../../../assets/hirelogo.png";

const navItems = [
  { href: "/dashboard", label: "Dashboard Home", icon: Home },
  { href: "/dashboard/providers", label: "Browse Providers", icon: Users },
  { href: "/dashboard/messages", label: "Messages/Chats", icon: MessageCircle },
  { href: "/dashboard/engagements", label: "My Engagements", icon: Briefcase },
  { href: "/dashboard/settings", label: "Profile Settings", icon: SettingsIcon },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState<string>("");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!mounted) return;
      const user = data.user;
      if (!user) {
        router.replace("/login");
        return;
      }
      setFullName(String(user.user_metadata?.full_name || "Customer"));
      setLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, [router]);

  const signOut = async () => {
    await supabase.auth.signOut();
    router.replace("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 text-gray-900">
        {/* Skeleton Header */}
        <div className="fixed top-0 inset-x-0 h-16 bg-white/80 backdrop-blur border-b border-gray-100 animate-pulse z-40" />

        {/* Body */}
        <div className="pt-16 flex">
          {/* Skeleton Sidebar */}
          <aside className="w-64 shrink-0 hidden md:block border-r border-gray-200 bg-white/80 backdrop-blur min-h-[calc(100vh-4rem)] sticky top-16">
            <div className="p-4 space-y-2">
              <div className="h-9 rounded-lg bg-gray-200 animate-pulse" />
              <div className="h-9 rounded-lg bg-gray-200 animate-pulse" />
              <div className="h-9 rounded-lg bg-gray-200 animate-pulse" />
              <div className="h-9 rounded-lg bg-gray-200 animate-pulse" />
              <div className="h-9 rounded-lg bg-gray-200 animate-pulse" />
            </div>
          </aside>

          {/* Skeleton Main Content */}
          <main className="flex-1 min-w-0">
            <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
              {/* Welcome + description skeleton */}
              <div className="space-y-2 mb-6">
                <div className="h-7 w-64 bg-gray-200 rounded-md animate-pulse" />
                <div className="h-4 w-80 bg-gray-200 rounded-md animate-pulse" />
              </div>

              {/* Metrics cards skeleton */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="h-5 w-32 bg-gray-200 rounded-md mb-4 animate-pulse" />
                  <div className="h-9 w-20 bg-gray-200 rounded-md animate-pulse" />
                </div>
                <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="h-5 w-32 bg-gray-200 rounded-md mb-4 animate-pulse" />
                  <div className="h-9 w-20 bg-gray-200 rounded-md animate-pulse" />
                </div>
                <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="h-5 w-24 bg-gray-200 rounded-md mb-4 animate-pulse" />
                  <div className="h-10 w-full bg-gray-200 rounded-full animate-pulse" />
                </div>
              </div>

              {/* Large panel skeleton */}
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="h-5 w-40 bg-gray-200 rounded-md mb-4 animate-pulse" />
                <div className="space-y-3">
                  <div className="h-4 w-72 bg-gray-200 rounded-md animate-pulse" />
                  <div className="h-4 w-64 bg-gray-200 rounded-md animate-pulse" />
                  <div className="h-4 w-56 bg-gray-200 rounded-md animate-pulse" />
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 text-gray-900">
      {/* Header */}
      <header className="fixed top-0 inset-x-0 h-16 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70 border-b border-gray-100 shadow-sm z-40">
        <div className="max-w-7xl mx-auto h-full px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2">
              <Image src={hireLogo} alt="Hirenest logo" className="h-8 w-auto" priority />
            </Link>
            <button
              aria-label="Open menu"
              title="Open menu"
              className="md:hidden p-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
              onClick={() => setMobileNavOpen(true)}
            >
              <Menu className="w-6 h-6" />
              <span className="ml-1 text-sm hidden sm:inline">Menu</span>
            </button>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-sm text-gray-600">Hi, {fullName}</span>
            <Button onClick={signOut} className="bg-[#8C12AA] hover:bg-[#8C12AA] rounded-full px-4">Logout</Button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-transparent"
            onClick={() => setMobileNavOpen(false)}
          />
          <div className="absolute top-16 left-0 bottom-0 w-72 max-w-[85%] bg-white border-r border-gray-200 shadow-xl">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <span className="font-semibold text-gray-800">Menu</span>
              <button aria-label="Close menu" className="p-2 rounded hover:bg-gray-100" onClick={() => setMobileNavOpen(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="p-4 space-y-1">
              {navItems.map((item) => {
                const active = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                      active
                        ? "bg-[#8C12AA]/10 text-[#8C12AA] shadow-sm"
                        : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                    onClick={() => setMobileNavOpen(false)}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}
      {/* Body */}
      <div className="pt-16 flex">
        {/* Sidebar */}
        <aside className="w-64 shrink-0 hidden md:block border-r border-gray-200 bg-white/90 backdrop-blur min-h-[calc(100vh-4rem)] sticky top-16">
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                    active
                      ? "bg-[#8C12AA]/10 text-[#8C12AA] font-semibold shadow-sm"
                      : "text-gray-700 hover:bg-gray-100 hover:shadow-sm"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main */}
        <main className="flex-1 min-w-0">
          <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
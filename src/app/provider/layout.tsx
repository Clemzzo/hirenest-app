"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { 
  Home, 
  User, 
  MessageCircle, 
  Briefcase, 
  Star,
  Settings as SettingsIcon, 
  Bell,
  ChevronDown,
  FileText,
  Menu,
  X
} from "lucide-react";
import { ProviderStateProvider } from '@/lib/ProviderStateContext';
import hireLogo from "../../../assets/hirelogo.png";

const navItems = [
  { href: "/provider", label: "Dashboard Home", icon: Home },
  { href: "/provider/profile", label: "Manage Profile", icon: User },
  // Removed: { href: "/provider/inquiries", label: "Inquiries", icon: FileText },
  { href: "/provider/jobs", label: "Jobs", icon: Briefcase },
  { href: "/provider/messages", label: "Messages", icon: MessageCircle },
  { href: "/provider/reviews", label: "Reviews", icon: Star },
  { href: "/provider/settings", label: "Settings", icon: SettingsIcon },
];

export default function ProviderDashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState<string>("");
  const [showDropdown, setShowDropdown] = useState(false);
  // Notification counts
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [newJobs, setNewJobs] = useState(0);
  // Independently track cleared counts for current session
  const [clearedUnread, setClearedUnread] = useState(0);
  const [clearedJobs, setClearedJobs] = useState(0);
  // Mobile nav drawer state
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    let channel: ReturnType<typeof supabase.channel> | null = null;
    (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!mounted) return;
      const user = sessionData.session?.user;
      if (!user) {
        router.replace("/login");
        return;
      }
      const role = user.user_metadata?.role;
      if (role !== "provider" && role !== "service-provider") {
        router.replace("/dashboard");
        return;
      }
      setFullName(String(user.user_metadata?.full_name || "Provider"));
      setLoading(false);

      await loadCounts(user.id);
      channel = supabase
        .channel(`provider_notifications_${user.id}`)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `recipient_id=eq.${user.id}` }, () => loadCounts(user.id))
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: "messages", filter: `recipient_id=eq.${user.id}` }, () => loadCounts(user.id))
        // Removed inquiries realtime: INSERT/UPDATE on inquiries
        .subscribe();
    })();

    return () => {
      mounted = false;
      if (channel) supabase.removeChannel(channel);
    };
  }, []);



  // Clear category-specific badges when the corresponding page is opened
  useEffect(() => {
    if (pathname === "/provider/messages") {
      setClearedUnread(unreadMessages);
    } else if (pathname === "/provider/jobs") {
      setClearedJobs(newJobs);
    }
  }, [pathname, unreadMessages, newJobs]);

  // Close mobile drawer when route changes
  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  const loadCounts = async (uid: string) => {
    try {
      const [msg] = await Promise.all([
        supabase.from("messages").select("id", { count: "exact", head: true }).eq("recipient_id", uid).is("read_at", null),
        // Removed: inquiries count
      ]);
      if (!msg.error && typeof msg.count === "number") setUnreadMessages(msg.count);
      // Removed: jobs from inquiries; keep jobs as-is or derive elsewhere
    } catch (e) {}
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    router.replace("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center text-gray-600">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8C12AA]"></div>
      </div>
    );
  }

  const effectiveUnread = Math.max(0, unreadMessages - clearedUnread);
  const effectiveJobs = Math.max(0, newJobs - clearedJobs);
  const totalNotifications = effectiveUnread + effectiveJobs;
  const showBadge = totalNotifications > 0;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Header */}
      <header className="fixed top-0 inset-x-0 h-16 bg-white border-b border-gray-200 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto h-full px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2">
              <Image src={hireLogo} alt="Hirenest logo" priority className="h-8 w-auto" />
            </Link>
            {/* Mobile menu toggle (shown on small screens) */}
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
          
          <div className="flex items-center gap-4">
            {/* Notification Bell */}
            <button
              onClick={() => {
                router.push('/provider/notifications');
              }}
              className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
            >
              <Bell className="w-5 h-5" />
              {showBadge && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                  {totalNotifications}
                </span>
              )}
            </button>
            
            {/* User Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 bg-[#8C12AA] text-white rounded-full flex items-center justify-center text-sm font-medium">
                  {fullName.charAt(0).toUpperCase()}
                </div>
                <span className="hidden sm:inline text-sm font-medium">{fullName}</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              
              {showDropdown && (
                <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  <Link 
                    href="/provider/profile" 
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setShowDropdown(false)}
                  >
                    Profile
                  </Link>
                  <Link 
                    href="/provider/settings" 
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setShowDropdown(false)}
                  >
                    Settings
                  </Link>
                  <hr className="my-1" />
                  <button 
                    onClick={signOut}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
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
        <aside className="w-64 shrink-0 hidden md:block border-r border-gray-200 bg-white min-h-[calc(100vh-4rem)] sticky top-16">
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
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
          
          {/* Sidebar Footer */}
          <div className="absolute bottom-4 left-4 right-4">
            <div className="bg-gradient-to-r from-[#8C12AA] to-purple-600 text-white p-4 rounded-lg">
              <h3 className="font-semibold text-sm">Get More Clients</h3>
              <p className="text-xs opacity-90 mt-1">Complete your profile to increase visibility</p>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 min-w-0">
          <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
            <ProviderStateProvider>{children}</ProviderStateProvider>
          </div>
        </main>
      </div>
      
      {/* Mobile backdrop for dropdown */}
      {showDropdown && (
        <div 
          className="fixed inset-0 z-30 bg-black bg-opacity-25 md:hidden"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
}
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, Mail } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ProfileCompletionModal } from "@/components/ui/modal";
import { useRouter } from "next/navigation";

export default function DashboardHome() {
  const [fullName, setFullName] = useState<string>("Customer");
  const [ongoingCount, setOngoingCount] = useState<number>(0);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [statsLoading, setStatsLoading] = useState<boolean>(true);
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    // Check for Google OAuth signup cookie first
    const isSignup = document.cookie.includes('hn_is_signup=true');
    
    if (isSignup) {
      // Clear the cookie
      document.cookie = 'hn_is_signup=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      
      // Check if user is authenticated
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          setShowProfileModal(true);
        } else {
          // If user not immediately available, listen for auth state change
          const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session?.user) {
              setShowProfileModal(true);
              subscription.unsubscribe();
            }
          });
        }
      });
    }

    (async () => {
      setStatsLoading(true);
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;
      setFullName(String(user?.user_metadata?.full_name || "Customer"));

      if (!user) { setStatsLoading(false); return; }

      // Fetch quick stats (safe to fail if tables not created yet)
      const [engRes, unreadRes] = await Promise.all([
        supabase.from("engagements").select("id", { count: "exact", head: true }).eq("customer_id", user.id).eq("status", "ongoing"),
        supabase.from("messages").select("id", { count: "exact", head: true }).eq("recipient_id", user.id).is("read_at", null),
      ]);
      if (!engRes.error && typeof engRes.count === "number") setOngoingCount(engRes.count);
      if (!unreadRes.error && typeof unreadRes.count === "number") setUnreadCount(unreadRes.count);
      setStatsLoading(false);
    })();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[#8C12AA]">Welcome back, <span className="text-gray-900">{fullName}</span></h1>
        <p className="text-gray-600 mt-1">Manage your providers, messages, and engagements in one place.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ongoing engagements</CardTitle>
            <div className="h-9 w-9 rounded-lg bg-violet-100 text-violet-600 flex items-center justify-center">
              <Briefcase className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="h-8 w-16 bg-gray-200 rounded-md animate-pulse" />
            ) : (
              <div className="text-3xl font-bold tracking-tight">{ongoingCount}</div>
            )}
          </CardContent>
        </Card>
        <Card className="rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unread messages</CardTitle>
            <div className="h-9 w-9 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
              <Mail className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="h-8 w-16 bg-gray-200 rounded-md animate-pulse" />
            ) : (
              <div className="text-3xl font-bold tracking-tight">{unreadCount}</div>
            )}
          </CardContent>
        </Card>
        <Card className="rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Quick action</CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/providers"><Button className="w-full rounded-full bg-[#8C12AA] hover:bg-[#8C12AA]">Browse providers</Button></Link>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold tracking-tight">Get started</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>Search by skill and location from the providers page</li>
            <li>Open a provider profile to view details, reviews, and start a chat</li>
            <li>Track your ongoing and past engagements in the engagements page</li>
          </ul>
        </CardContent>
      </Card>
      
      <ProfileCompletionModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onNavigateToDashboard={() => {
          setShowProfileModal(false);
          // Stay on current dashboard
        }}
      />
    </div>
  );
}
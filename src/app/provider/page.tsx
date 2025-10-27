"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileCompletionModal } from "@/components/ui/modal";
import { useRouter } from "next/navigation";

export default function ProviderHome() {
  const [fullName, setFullName] = useState<string>("Provider");
  const [activeJobs, setActiveJobs] = useState<number>(0);
  const [avgRating, setAvgRating] = useState<number>(0);
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
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;
      setFullName(String(user?.user_metadata?.full_name || "Provider"));
      if (!user) return;

      const [jobs, ratings] = await Promise.all([
        supabase.from("engagements").select("id", { count: "exact", head: true }).eq("provider_id", user.id).eq("status", "ongoing"),
        supabase.from("reviews_summary").select("avg_rating").eq("provider_id", user.id).single(),
      ]);

      if (!jobs.error && typeof jobs.count === "number") setActiveJobs(jobs.count);
      if (!ratings.error && ratings.data) setAvgRating(Number(ratings.data.avg_rating || 0));
    })();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div>
        <h1 className="text-2xl md:text-0.75rem font-semibold text-[#8C12AA]">Welcome, {fullName}</h1>
        <p className="text-gray-600 mt-1">Here’s a quick snapshot of your service activity.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="transition-transform hover:translate-y-[-2px] border" style={{ borderColor: "#AD15B0" }}>
          <CardHeader>
            <CardTitle className="text-[12px] text-[#8C12AA]">Active Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{activeJobs}</div>
          </CardContent>
        </Card>
        <Card className="transition-transform hover:translate-y-[-2px] border" style={{ borderColor: "#AD15B0" }}>
          <CardHeader>
            <CardTitle className="text-[12px] text-[#8C12AA]">Average Rating</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{avgRating.toFixed(1)}</div>
          </CardContent>
        </Card>
      </div>
      
      <ProfileCompletionModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onNavigateToDashboard={() => {
          setShowProfileModal(false);
          // Stay on current provider dashboard
        }}
      />
    </div>
  );
}
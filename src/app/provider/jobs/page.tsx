"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, User as UserIcon } from "lucide-react";

type Job = { id: string; title: string | null; customer_name: string | null; status: string };

export default function JobsHistoryPage() {
  const [jobs, setJobs] = useState<Job[]>([]);

  useEffect(() => {
    (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;
      if (!user) return;
      const { data } = await supabase
        .from("engagements_view")
        .select("id, title, customer_name, status")
        .eq("provider_id", user.id)
        .order("created_at", { ascending: false });
      setJobs((data as Job[]) || []);
    })();
  }, []);

  const badge = (status: string) => {
    const map: Record<string, string> = {
      accepted: "bg-blue-100 text-blue-700",
      ongoing: "bg-yellow-100 text-yellow-700",
      completed: "bg-green-100 text-green-700",
      declined: "bg-red-100 text-red-700",
    };
    return map[status] || "bg-gray-100 text-gray-700";
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <Card className="transition-all duration-200 hover:shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Briefcase className="w-5 h-5" /> Jobs & Requests History</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {jobs.length === 0 && <div className="text-sm text-gray-600">No jobs yet.</div>}
          {jobs.map((j) => (
            <div key={j.id} className="flex items-center justify-between p-4 border rounded-lg hover:shadow transition-shadow bg-white">
              <div className="space-y-1">
                <div className="flex items-center gap-2 font-medium">
                  <Briefcase className="w-4 h-4 text-gray-500" />
                  {j.title || "Job"}
                </div>
                <div className="text-sm text-gray-600 inline-flex items-center gap-1">
                  <UserIcon className="w-4 h-4" /> {j.customer_name || "Customer"}
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${badge(j.status)}`}>{j.status}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
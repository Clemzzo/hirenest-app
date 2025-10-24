"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Engagement { id: string; title: string | null; status: string; created_at: string; provider_name?: string | null }

export default function EngagementsPage() {
  const [ongoing, setOngoing] = useState<Engagement[]>([]);
  const [past, setPast] = useState<Engagement[]>([]);

  useEffect(() => {
    (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;
      if (!user) return;
      const { data: rows } = await supabase
        .from("engagements_view")
        .select("id, title, status, created_at, provider_name")
        .eq("customer_id", user.id)
        .order("created_at", { ascending: false });
      const items = (rows as Engagement[]) || [];
      setOngoing(items.filter((e) => e.status === "ongoing"));
      setPast(items.filter((e) => e.status !== "ongoing"));
    })();
  }, []);

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-xl font-semibold mb-3">Ongoing</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ongoing.map((e) => (
            <Card key={e.id}>
              <CardHeader>
                <CardTitle className="text-base">{e.title || "Untitled engagement"}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-600">Provider: {e.provider_name || "—"}</div>
                <div className="text-sm text-gray-600">Started: {new Date(e.created_at).toLocaleString()}</div>
              </CardContent>
            </Card>
          ))}
          {ongoing.length === 0 && <div className="text-gray-600">No ongoing engagements.</div>}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-3">Past</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {past.map((e) => (
            <Card key={e.id}>
              <CardHeader>
                <CardTitle className="text-base">{e.title || "Untitled engagement"}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-600">Provider: {e.provider_name || "—"}</div>
                <div className="text-sm text-gray-600">Created: {new Date(e.created_at).toLocaleString()}</div>
                <div className="inline-flex text-xs mt-2 px-2 py-1 rounded bg-gray-100">{e.status}</div>
              </CardContent>
            </Card>
          ))}
          {past.length === 0 && <div className="text-gray-600">No past engagements.</div>}
        </div>
      </section>
    </div>
  );
}
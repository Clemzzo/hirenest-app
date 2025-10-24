"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle } from "lucide-react";

interface MsgNote { id: string; chat_id: string; content: string; created_at: string }

export default function ProviderNotificationsPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<MsgNote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      const uid = data.session?.user.id || null;
      setUserId(uid);
      if (!uid) { setLoading(false); return; }

      // Unread messages for provider
      const { data: m } = await supabase
        .from("messages")
        .select("id, chat_id, content, created_at")
        .eq("recipient_id", uid)
        .is("read_at", null)
        .order("created_at", { ascending: false })
        .limit(50);

      setMsgs((m as MsgNote[]) || []);
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="p-4">Loading notifications…</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <Card className="transition-all duration-200 hover:shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><MessageCircle className="w-5 h-5" /> Unread messages</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {msgs.length === 0 && <div className="text-sm text-gray-600">No unread messages.</div>}
          {msgs.map((m) => (
            <Link key={m.id} href={`/provider/messages?chat=${m.chat_id}`} className="block p-3 border rounded-lg hover:bg-gray-50">
              <div className="text-sm font-medium truncate">{m.content}</div>
              <div className="text-xs text-gray-500">{new Date(m.created_at).toLocaleString()}</div>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
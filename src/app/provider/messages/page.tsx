"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MessageCircle, Search as SearchIcon } from "lucide-react";
import { useSearchParams } from "next/navigation";

// Model expected: chats(id, customer_id, provider_id), messages(id, chat_id, sender_id, content, created_at)

type Chat = { id: string; other_name: string | null; avatar_url?: string | null };

type Message = { id: string; chat_id: string; sender_id: string; content: string; created_at: string };

// Helper to format date as Mon DD (e.g., Dec 15)
const formatDate = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString([], { month: "short", day: "2-digit" });
};

export default function ProviderMessagesPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const [lastMeta, setLastMeta] = useState<Record<string, { content: string; created_at: string } | null>>({});
  const listRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    const chatParam = searchParams.get("chat");
    if (chatParam) setActiveChat(chatParam);
  }, [searchParams]);
  
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      const uid = data.session?.user.id || null;
      setUserId(uid);
      if (!uid) return;

      await reloadChats(uid);
    })();
  }, []);

  useEffect(() => {
    if (!activeChat) return;
    (async () => {
      const { data: rows } = await supabase
        .from("messages")
        .select("id, chat_id, sender_id, content, created_at")
        .eq("chat_id", activeChat)
        .order("created_at", { ascending: true });
      setMessages((rows as Message[]) || []);
      // Mark messages as read for current user if schema supports
      if (userId) {
        try {
          await supabase
            .from("messages")
            .update({ read_at: new Date().toISOString() })
            .eq("chat_id", activeChat)
            .eq("recipient_id", userId)
            .is("read_at", null);
        } catch (_) {}
      }
      setTimeout(() => listRef.current?.scrollTo({ top: listRef.current!.scrollHeight }), 50);
    })();

    const channel = supabase
      .channel("room:" + activeChat)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `chat_id=eq.${activeChat}` }, (payload) => {
        // Deduplicate any optimistic placeholder for the same message
        setMessages((prev) => {
          const incoming = payload.new as Message & { _optimistic?: boolean };
          const idx = prev.findIndex((m: any) => m._optimistic && m.chat_id === incoming.chat_id && m.sender_id === incoming.sender_id && m.content === incoming.content);
          if (idx !== -1) {
            const copy = prev.slice();
            copy.splice(idx, 1);
            return [...copy, incoming];
          }
          return [...prev, incoming];
        });
        setTimeout(() => listRef.current?.scrollTo({ top: listRef.current!.scrollHeight }), 50);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeChat, userId]);

  const send = async () => {
    if (!draft.trim() || !activeChat || !userId) return;
    const content = draft.trim();

    // Optimistic UI: append a temporary message immediately
    const temp: any = { id: "temp-" + Date.now(), chat_id: activeChat, sender_id: userId, content, created_at: new Date().toISOString(), _optimistic: true };
    setMessages((prev) => [...prev, temp]);
    setDraft("");
    setTimeout(() => listRef.current?.scrollTo({ top: listRef.current!.scrollHeight }), 0);

    // Determine recipient based on chat participants
    let recipientId: string | null = null;
    try {
      const { data: chatRow } = await supabase
        .from("chats")
        .select("customer_id, provider_id")
        .eq("id", activeChat)
        .single();
      if (chatRow) {
        recipientId = userId === chatRow.customer_id ? chatRow.provider_id : chatRow.customer_id;
      }
    } catch (_) {}

    const payload: any = { chat_id: activeChat, sender_id: userId, content };
    if (recipientId) payload.recipient_id = recipientId;

    let ok = false;
    try {
      const { error } = await supabase.from("messages").insert(payload);
      if (!error) ok = true;
    } catch (_) {}

    if (!ok) {
      await supabase.from("messages").insert({ chat_id: activeChat, sender_id: userId, content });
    }

    try { await supabase.from("chats").update({ updated_at: new Date().toISOString() }).eq("id", activeChat); } catch (_) {}

    await reloadChats(userId || undefined);
  };

  const fetchLastMeta = async (ids: string[]) => {
    if (ids.length === 0) return;
    const entries = await Promise.all(
      ids.map(async (id) => {
        const { data: rows } = await supabase
          .from("messages")
          .select("content, created_at")
          .eq("chat_id", id)
          .order("created_at", { ascending: false })
          .limit(1);
        const row = (rows?.[0] as { content: string; created_at: string } | undefined) || undefined;
        return [id, row ?? null] as const;
      })
    );
    setLastMeta(Object.fromEntries(entries));
  };

  const reloadChats = async (uidOverride?: string) => {
    const { data: chatRows, error } = await supabase
      .from("chats_min_provider")
      .select("id, other_name, other_avatar_url")
      .order("updated_at", { ascending: false });

    if (!error && chatRows && chatRows.length > 0) {
      const ids = (chatRows as any[]).map((r) => r.id as string);
      setChats((chatRows as any[]).map((r) => ({ id: r.id as string, other_name: r.other_name as string | null, avatar_url: (r as any).other_avatar_url as string | null })));
      await fetchLastMeta(ids);
      return;
    }

    const uid = uidOverride || userId;
    if (!uid) return;

    // Fallback: Select chats where current user is provider
    const { data: baseChats, error: baseErr } = await supabase
      .from("chats")
      .select("id, customer_id")
      .eq("provider_id", uid)
      .order("created_at", { ascending: false });

    if (baseErr || !baseChats) {
      setChats([]);
      return;
    }

    const customerIds = Array.from(new Set((baseChats as any[]).map((c: any) => c.customer_id).filter(Boolean)));
    let nameById: Record<string, string> = {};
    let avatarById: Record<string, string | null> = {};
    if (customerIds.length > 0) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", customerIds);
      (profs as any[] | null | undefined)?.forEach((p: any) => {
        nameById[p.id] = p.full_name || "";
        avatarById[p.id] = p.avatar_url || null;
      });
    }

    const chatsBuilt = (baseChats as any[]).map((c: any) => ({ id: c.id as string, other_name: nameById[c.customer_id] || "Conversation", avatar_url: avatarById[c.customer_id] || null }));
    setChats(chatsBuilt);
    await fetchLastMeta(chatsBuilt.map((c) => c.id));
  };

  const filteredChats = chats.filter((c) => (c.other_name || "Conversation").toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 min-h-[60vh] animate-in fade-in duration-200">
      <Card className="md:col-span-1">
        <CardHeader className="space-y-3">
          <CardTitle className="sr-only"><MessageCircle className="w-5 h-5" /> Chats</CardTitle>
          <div className="relative">
            <SearchIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search providers or customers"
              className="pl-9 rounded-2xl h-10 border-gray-300"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0 divide-y">
          {filteredChats.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveChat(c.id)}
              className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-center justify-between ${activeChat === c.id ? "bg-gray-50" : ""}`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                  {c.avatar_url ? (
                    <img src={c.avatar_url} alt={c.other_name || "User"} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-sm text-gray-600">{(c.other_name?.charAt(0).toUpperCase() || "U")}</div>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-sm truncate">{c.other_name || "Conversation"}</div>
                  <div className="text-xs text-gray-500 truncate">{lastMeta[c.id]?.content || "Tap to open conversation"}</div>
                </div>
              </div>
              <div className="text-xs text-gray-500 flex-shrink-0">{formatDate(lastMeta[c.id]?.created_at)}</div>
            </button>
          ))}
          {filteredChats.length === 0 && <div className="p-4 text-sm text-gray-600">No conversations yet.</div>}
        </CardContent>
      </Card>

      <Card className="md:col-span-2 flex flex-col">
        <CardHeader>
          <CardTitle>{activeChat ? "Conversation" : "Select a chat"}</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col p-0">
          <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-2 bg-white">
            {messages.map((m) => (
              <div key={m.id} className={`max-w-[75%] rounded-lg px-3 py-2 text-sm transition-transform ${m.sender_id === userId ? "bg-[#8C12AA] text-white ml-auto" : "bg-gray-100"}`}>
                <div>{m.content}</div>
                <div className={`mt-1 text-[10px] ${m.sender_id === userId ? "text-white/80" : "text-gray-500"}`}>{new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
              </div>
            ))}
          </div>
          <div className="p-3 border-t flex items-center gap-2">
            <Input placeholder="Type a message…" value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") send(); }} />
            <Button onClick={send} className="bg-[#8C12AA] hover:bg-[#8C12AA]">Send</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
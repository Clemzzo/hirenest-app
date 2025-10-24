"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { allCategories } from "@/lib/categories";

const states = [
  "Lagos","FCT - Abuja","Rivers","Oyo","Abia","Kano","Kaduna","Enugu","Anambra","Delta"
];

export default function SettingsPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<string>("customer");
  const [bio, setBio] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [coverage, setCoverage] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;
      if (!user) return;
      setFullName(String(user.user_metadata?.full_name || ""));
      setEmail(String(user.email || ""));
      setRole(String(user.user_metadata?.role || "customer"));
      setBio(String(user.user_metadata?.bio || ""));
      setCategories((user.user_metadata?.categories as string[]) || []);
      setCoverage((user.user_metadata?.coverage_areas as string[]) || []);
      setPhoneNumber(String(user.user_metadata?.phone_number || ""));
      setAvatarUrl((user.user_metadata?.avatar_url as string | undefined) || null);
      // Optionally fetch services from providers table to keep UI in sync (no-op for now)
      await supabase
        .from("providers")
        .select("services")
        .eq("id", user.id)
        .single();
      // Try to fetch avatar_url from profiles for consistency
      const { data: profRow } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("id", user.id)
        .single();
      if (profRow?.avatar_url) setAvatarUrl(profRow.avatar_url as string);
      // We do not show services UI here, and we avoid updating services from this page to prevent accidental clearing.
    })();
  }, []);

  useEffect(() => {
    if (!successToast) return;
    const t = setTimeout(() => setSuccessToast(null), 4000);
    return () => clearTimeout(t);
  }, [successToast]);

  const toggle = (list: string[], value: string, setter: (v: string[]) => void) => {
    if (list.includes(value)) setter(list.filter((v) => v !== value));
    else setter([...list, value]);
  };

  const uploadAvatar = async (file: File) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      throw new Error("Avatar must be 2MB or smaller");
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("You must be signed in to update avatar.");
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const path = `${user.id}/avatar-${Date.now()}.${ext}`;
    const { error: uploadErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true, contentType: file.type });
    if (uploadErr) throw uploadErr;
    const { data: pub } = await supabase.storage.from("avatars").getPublicUrl(path);
    const publicUrl = pub.publicUrl as string;
    const { error: authUpdateErr } = await supabase.auth.updateUser({ data: { avatar_url: publicUrl } });
    if (authUpdateErr) throw authUpdateErr;
    const { error: profileUpdateErr } = await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", user.id);
    if (profileUpdateErr) throw profileUpdateErr;
    setAvatarUrl(publicUrl);
    setSuccessToast("Avatar updated successfully!");
    return publicUrl;
  };

  const save = async () => {
    setSaving(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;
      if (!user) return;

      if (role === "customer") {
        await supabase.auth.updateUser({
          data: { full_name: fullName, phone_number: phoneNumber },
        });
        await supabase.from("profiles").upsert(
          {
            id: user.id,
            full_name: fullName,
            role: "customer",
            phone_number: phoneNumber,
            avatar_url: avatarUrl || null,
          },
          { onConflict: "id" }
        );
      } else {
        // Do NOT include services here; services are managed on Provider Profile page only
        await supabase.auth.updateUser({
          data: { full_name: fullName, bio, categories, coverage_areas: coverage, phone_number: phoneNumber },
        });
        await supabase.from("profiles").upsert(
          {
            id: user.id,
            full_name: fullName,
            bio,
            categories,
            coverage_areas: coverage,
            role: user.user_metadata?.role || "provider",
            phone_number: phoneNumber,
            avatar_url: avatarUrl || null,
          },
          { onConflict: "id" }
        );
        // Intentionally skip providers.services upsert to avoid clearing existing services when saving non-service fields.
      }

      setSuccessToast("Profile updated successfully.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {successToast && (
        <div className="fixed top-6 right-6 z-50 animate-slide-up">
          <div className="flex items-start gap-3 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-green-800 shadow-lg">
            <svg className="mt-0.5 h-5 w-5 text-green-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 10-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.155-.094l3.983-5.495z" clipRule="evenodd" />
            </svg>
            <div>
              <div className="text-sm font-medium">Success</div>
              <div className="text-sm">{successToast}</div>
            </div>
            <button
              type="button"
              aria-label="Close"
              className="ml-4 text-green-700 hover:text-green-900"
              onClick={() => setSuccessToast(null)}
            >
              ×
            </button>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Avatar upload section */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center text-sm font-medium text-gray-700">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                (fullName?.charAt(0).toUpperCase() || "C")
              )}
            </div>
            <div className="flex items-center gap-2">
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    setAvatarUploading(true);
                    try {
                      await uploadAvatar(f);
                    } catch (err) {
                      console.error(err);
                    } finally {
                      setAvatarUploading(false);
                      if (avatarInputRef.current) avatarInputRef.current.value = "";
                    }
                  }
                }}
              />
              <Button type="button" onClick={() => avatarInputRef.current?.click()} disabled={avatarUploading} className="bg-[#8C12AA] hover:bg-[#8C12AA]/90">
                {avatarUploading ? "Uploading…" : "Change avatar"}
              </Button>
            </div>
          </div>

          {/* Always visible fields for both roles */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full max-w-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
            <Input value={email} readOnly disabled className="w-full max-w-sm bg-gray-50" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone number</label>
            <Input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="w-full max-w-sm" />
          </div>

          {/* Only for service providers */}
          {role !== "customer" && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                <Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={5} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Categories</label>
                <div className="flex flex-wrap gap-2">
                  {allCategories.map((c) => {
                    const active = categories.includes(c.slug);
                    return (
                      <button
                        key={c.slug}
                        onClick={() => toggle(categories, c.slug, setCategories)}
                        className={`px-3 py-1 rounded-full text-sm border ${
                          active
                            ? "bg-[#8C12AA]/10 text-[#8C12AA] border-[#8C12AA]/30"
                            : "bg-white hover:bg-gray-50"
                        }`}
                      >
                        {c.title}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Coverage areas</label>
                <div className="flex flex-wrap gap-2">
                  {states.map((s) => {
                    const active = coverage.includes(s);
                    return (
                      <button
                        key={s}
                        onClick={() => toggle(coverage, s, setCoverage)}
                        className={`px-3 py-1 rounded-full text-sm border ${
                          active
                            ? "bg-[#8C12AA]/10 text-[#8C12AA] border-[#8C12AA]/30"
                            : "bg-white hover:bg-gray-50"
                        }`}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          <div className="flex justify-end">
            <Button onClick={save} disabled={saving} className="bg-[#8C12AA] hover:bg-[#8C12AA]">
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
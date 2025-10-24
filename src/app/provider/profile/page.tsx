"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { allCategories } from "@/lib/categories";
import { useProviderState } from '@/lib/ProviderStateContext';

const states = [
  "Lagos","FCT - Abuja","Rivers","Oyo","Abia","Kano","Kaduna","Enugu","Anambra","Delta"
];

export default function ProviderProfilePage() {
  const [fullName, setFullName] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [coverage, setCoverage] = useState<string[]>([]);
  const [bio, setBio] = useState("");
  const [idUrl, setIdUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [cityInput, setCityInput] = useState("");
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [services, setServices] = useState<string[]>([]);
  const [serviceInput, setServiceInput] = useState("");
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const { services: contextServices, setServices: setContextServices } = useProviderState();

  // Auto-hide success toast after a few seconds
  useEffect(() => {
    if (!successToast) return;
    const t = setTimeout(() => setSuccessToast(null), 3500);
    return () => clearTimeout(t);
  }, [successToast]);

  // Auto-hide error toast after a few seconds
  useEffect(() => {
    if (!errorToast) return;
    const t = setTimeout(() => setErrorToast(null), 4500);
    return () => clearTimeout(t);
  }, [errorToast]);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setFullName(user.user_metadata?.full_name || "");
      setBio(user.user_metadata?.bio || "");
      setSkills((user.user_metadata?.categories as string[]) || []);
      setCoverage((user.user_metadata?.coverage_areas as string[]) || []);
      setPhoneNumber(String(user.user_metadata?.phone_number || ""));
      setAvatarUrl((user.user_metadata?.avatar_url as string | undefined) || null);
      let fetchedServices = (user.user_metadata?.services as string[]) || [];

      // Try to load services from profiles table first
      const { data: profileRow, error: profileErr } = await supabase
        .from("profiles")
        .select("services")
        .eq("id", user.id)
        .single();
      if (!profileErr && profileRow?.services && Array.isArray(profileRow.services)) {
        fetchedServices = profileRow.services as string[];
      }

      // Then try providers table if not found or empty in profiles
      const { data: provRow, error: provErr } = await supabase
        .from("providers")
        .select("services")
        .eq("id", user.id)
        .single();
      if (!provErr && provRow?.services && Array.isArray(provRow.services) && fetchedServices.length === 0) {
        fetchedServices = provRow.services as string[];
      }

      // Load from localStorage if draft exists
      const draftServices = localStorage.getItem('draftServices');

      let initialServices;
      if (draftServices) {
        initialServices = JSON.parse(draftServices);
      } else if (contextServices.length > 0) {
        initialServices = contextServices;
      } else {
        initialServices = fetchedServices;
        setContextServices(initialServices);
      }
      setServices(initialServices);

      // Use Auth metadata for ID URL instead of profiles column
      const metaUrl = user.user_metadata?.id_document_url as string | undefined;
      if (metaUrl) setIdUrl(metaUrl);
    })();
  }, []);

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    const parts = name.trim().split(/\s+/).filter(Boolean);
    const initials = parts.slice(0, 2).map(p => p[0]?.toUpperCase() || "").join("");
    return initials || "U";
  };

  const toggle = (list: string[], value: string, setter: (v: string[]) => void) => {
    if (list.includes(value)) setter(list.filter((v) => v !== value));
    else setter([...list, value]);
  };

  const addCity = () => {
    const name = cityInput.trim();
    if (!name) return;
    if (!coverage.includes(name)) setCoverage([...coverage, name]);
    setCityInput("");
  };

  const removeCustomCoverage = (name: string) => {
    setCoverage((prev) => prev.filter((c) => c !== name));
  };

  const addService = () => {
    const inputs = serviceInput.split(',').map(s => s.trim()).filter(s => s !== '');
    if (inputs.length === 0) return;
    let newServices = [...services];
    for (const name of inputs) {
      if (!newServices.includes(name)) {
        newServices = [...newServices, name];
      }
    }
    setServices(newServices);
    setServiceInput("");
    localStorage.setItem('draftServices', JSON.stringify(newServices));
  };

  const removeService = async (name: string) => {
  const oldServices = [...services]; // Backup for revert
  const newServices = services.filter((s) => s !== name);
  setServices(newServices);
  localStorage.setItem('draftServices', JSON.stringify(newServices));

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { error: profileError } = await supabase.from("profiles").update({ services: newServices }).eq("id", user.id);
      if (profileError) throw profileError;

      // Optionally update providers table
      const { error: providerError } = await supabase.from("providers").update({ services: newServices }).eq("id", user.id);
    }
  } catch (err: any) {
    setErrorToast(err.message || "Failed to update services in database.");
    // Revert state
    setServices(oldServices);
    localStorage.setItem('draftServices', JSON.stringify(oldServices));
  }
};

  const uploadId = async (file: File, userId: string) => {
    if (file.size > 300 * 1024) {
      throw new Error("ID file must be 300KB or smaller");
    }
    const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
    const path = `${userId}/id.${ext}`;
    const { error } = await supabase.storage.from("provider-ids").upload(path, file, { upsert: true, contentType: file.type });
    if (error) throw error;
    const { data } = await supabase.storage.from("provider-ids").getPublicUrl(path);
    return data.publicUrl as string;
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
    // Update profiles table
    const { error: profileUpdateErr } = await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", user.id);
    if (profileUpdateErr) throw profileUpdateErr;
    setAvatarUrl(publicUrl);
    return publicUrl;
  };

  const save = async () => {
    setSaving(true);
    try {
      const { data, error: getUserError } = await supabase.auth.getUser();
      const user = data.user;
      if (getUserError) {
        setErrorToast(getUserError.message || "Unable to get current user.");
        return;
      }
      if (!user) {
        setErrorToast("You must be signed in to save your profile.");
        return;
      }

      let newIdUrl = idUrl;
      const file = fileRef.current?.files?.[0];
      if (file) {
        newIdUrl = await uploadId(file, user.id);
        setIdUrl(newIdUrl);
      }

      let hadError = false;

      // Ensure role is consistently stored as service-provider
      const { error: authUpdateErr } = await supabase.auth.updateUser({
        data: {
          full_name: fullName,
          bio,
          categories: skills,
          coverage_areas: coverage,
          role: "service-provider",
          id_document_url: newIdUrl || null,
          phone_number: phoneNumber,
          services,
        },
      });
      if (authUpdateErr) {
        setErrorToast(authUpdateErr.message || "Failed to update account profile.");
        hadError = true;
        // continue to try updating profiles table anyway
      }

      const payload = {
        full_name: fullName,
        bio,
        categories: skills,
        coverage_areas: coverage,
        role: "service-provider",
        phone_number: phoneNumber,
        services,
        avatar_url: avatarUrl || null,
      };

      // Prefer update first. If no row exists (PGRST116) or similar, fall back to insert.
      let savedRow: any = null;
      const { data: updData, error: updErr } = await supabase
        .from("profiles")
        .update(payload)
        .eq("id", user.id)
        .select("full_name, bio, categories, coverage_areas, role, phone_number, services")
        .single();
      if (!updErr) {
        savedRow = updData;
      } else {
        setErrorToast(updErr.message || "Failed to save profile details.");
        hadError = true;
      }

      if (!savedRow) {
        // If update failed or no row returned, try insert
        const { data: insData, error: insErr } = await supabase
          .from("profiles")
          .insert({ id: user.id, ...payload })
          .select("full_name, bio, categories, coverage_areas, role, phone_number, services")
          .single();
        if (insErr) {
          setErrorToast(insErr.message || "Failed to save profile details.");
          hadError = true;
        } else {
          savedRow = insData;
        }
      }

      // Fallback: if we have no row returned (e.g. minimal return), try to refetch
      if (!savedRow) {
        const { data: refetchRow, error: refetchErr } = await supabase
          .from("profiles")
          .select("full_name, bio, categories, coverage_areas, role, phone_number, services")
          .eq("id", user.id)
          .single();
        if (!refetchErr && refetchRow) {
          savedRow = refetchRow;
        } else {
          setErrorToast(refetchErr.message || "Failed to refetch profile details.");
          hadError = true;
        }
      }

      // Also upsert services into providers table
      const { error: provUpsertErr } = await supabase
        .from("providers")
        .upsert({ id: user.id, services }, { onConflict: "id" });
      // Ignore providers table errors silently to avoid blocking profile save
      

      // Refetch user metadata to update UI state
      const { data: refreshedData, error: refreshError } = await supabase.auth.getUser();
      if (refreshError) {
        setErrorToast(refreshError.message || "Failed to refresh profile data.");
        hadError = true;
      } else if (refreshedData?.user) {
        const meta = refreshedData.user.user_metadata;
        setFullName(meta.full_name || "");
        setBio(meta.bio || "");
        setSkills(meta.categories || []);
        setCoverage(meta.coverage_areas || []);
        setPhoneNumber(meta.phone_number || "");
        setServices(meta.services || []);
        setIdUrl(meta.id_document_url || newIdUrl || null); // Fallback to newIdUrl if not in meta
      }

      // Clear draft after successful save
      if (!hadError) {
        setSuccessToast("Profile saved successfully!");
        localStorage.removeItem('draftServices');
        setContextServices(services);
      } else {
        setErrorToast("There were errors saving your profile. Some changes may not have been applied.");
      }
    } catch (err: any) {
      const message = err?.message || "Failed to save profile.";
      setErrorToast(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
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
      {errorToast && (
        <div className="fixed top-6 right-6 z-50 animate-slide-up">
          <div className="flex items-start gap-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-red-800 shadow-lg">
            <svg className="mt-0.5 h-5 w-5 text-red-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9 7h2v5H9V7zm0 6h2v2H9v-2z" clipRule="evenodd" />
            </svg>
            <div>
              <div className="text-sm font-medium">Error</div>
              <div className="text-sm">{errorToast}</div>
            </div>
            <button
              type="button"
              aria-label="Close"
              className="ml-4 text-red-700 hover:text-red-900"
              onClick={() => setErrorToast(null)}
            >
              ×
            </button>
          </div>
        </div>
      )}
      <Card className="transition-all duration-200 hover:shadow-md">
        <CardHeader>
          <CardTitle>Manage Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Profile avatar</label>
                <div className="flex items-center gap-4">
                  <div className="h-20 w-20 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-gray-600 font-medium">{getInitials(fullName)}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={async (e) => {
                        const f = e.target.files?.[0];
                        if (f) {
                          setAvatarUploading(true);
                          try {
                            await uploadAvatar(f);
                            setSuccessToast("Avatar updated successfully!");
                          } catch (err: any) {
                            setErrorToast(err?.message || "Failed to update avatar.");
                          } finally {
                            setAvatarUploading(false);
                            if (avatarInputRef.current) {
                              avatarInputRef.current.value = "";
                            }
                          }
                        }
                      }}
                    />
                    <Button type="button" onClick={() => avatarInputRef.current?.click()} disabled={avatarUploading} className="bg-[#8C12AA] hover:bg-[#8C12AA]/90">
                      {avatarUploading ? "Uploading..." : "Change avatar"}
                    </Button>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} className="max-w-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone number</label>
                <Input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="max-w-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Short description</label>
                <Textarea rows={6} value={bio} onChange={(e) => setBio(e.target.value)} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Upload ID (max 300KB)</label>
                <input ref={fileRef} type="file" accept="image/*,application/pdf" className="text-sm" />
                {idUrl && (
                  <p className="text-xs text-gray-600 mt-1">
                    Uploaded: <a href={idUrl} target="_blank" className="text-[#8C12AA] underline">View ID</a>
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Skills</label>
                <div className="flex flex-wrap gap-2">
                  {allCategories.map((c) => {
                    const active = skills.includes(c.slug);
                    return (
                      <button
                        key={c.slug}
                        onClick={() => toggle(skills, c.slug, setSkills)}
                        className={`px-3 py-1 rounded-full text-sm border transition-all ${
                          active ? "bg-[#8C12AA]/10 text-[#8C12AA] border-[#8C12AA]/30" : "bg-white hover:bg-gray-50"
                        }`}
                      >
                        {c.title}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Services you offer</label>
                <div className="flex items-center gap-2 max-w-md">
                  <Input
                    placeholder="Add a service e.g. Plumbing repair, AC installation…"
                    value={serviceInput}
                    onChange={(e) => setServiceInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addService(); } }}
                  />
                  <Button type="button" variant="outline" onClick={addService}>Add</Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {services.map((srv) => (
                    <span key={srv} className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm bg-gray-100 border">
                      {srv}
                      <button
                        type="button"
                        className="text-gray-500 hover:text-gray-700"
                        onClick={() => removeService(srv)}
                        aria-label={`Remove ${srv}`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">Enter services separated by commas, then press Enter or click Add.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Coverage areas (state / city)</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {states.map((s) => {
                    const active = coverage.includes(s);
                    return (
                      <button
                        key={s}
                        onClick={() => toggle(coverage, s, setCoverage)}
                        className={`px-3 py-1 rounded-full text-sm border transition-all ${
                          active ? "bg-[#8C12AA]/10 text-[#8C12AA] border-[#8C12AA]/30" : "bg-white hover:bg-gray-50"
                        }`}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2 max-w-md">
                  <Input
                    placeholder="Add a city e.g. Ikeja, Yaba, Wuse…"
                    value={cityInput}
                    onChange={(e) => setCityInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCity(); } }}
                  />
                  <Button type="button" variant="outline" onClick={addCity}>Add</Button>
                </div>

                {/* Custom coverage chips (cities) */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {coverage
                    .filter((c) => !states.includes(c))
                    .map((city) => (
                      <span key={city} className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm bg-gray-100 border">
                        {city}
                        <button
                          type="button"
                          className="text-gray-500 hover:text-gray-700"
                          onClick={() => removeCustomCoverage(city)}
                          aria-label={`Remove ${city}`}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="button" onClick={save} disabled={saving} className="bg-[#8C12AA] hover:bg-[#8C12AA] disabled:opacity-70">
               {saving ? "Saving…" : "Save"}
             </Button>
          </div>
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <h3 className="text-lg font-semibold mb-2">Your Services Offered</h3>
        {services.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {services.map((service, index) => (
              <span key={index} className="px-3 py-1 bg-gray-200 text-gray-800 rounded-full text-sm">
                {service}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No services listed yet.</p>
        )}
      </div>
    </div>
  );
}
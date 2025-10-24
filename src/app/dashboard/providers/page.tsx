"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { allCategories } from "@/lib/categories";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";

// Minimal list of Nigerian states for filter (could be extended)
const states = [
  "Lagos","FCT - Abuja","Rivers","Oyo","Abia","Kano","Kaduna","Enugu","Anambra","Delta"
];

// Helper to render initials when no avatar image is available
const getInitials = (name: string | null) => {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const initials = parts.slice(0, 2).map(p => p[0]?.toUpperCase() || "").join("");
  return initials || "U";
};

// Updated Review type
type Review = { id: string; rating: number; comment: string | null; created_at: string; customer_name: string | null };

type Provider = {
  id: string;
  full_name: string | null;
  bio: string | null;
  categories: string[] | null;
  coverage_areas: string[] | null;
  services: string[] | null;
  avg_rating?: number | null;
  review_count?: number | null;
  avatar_url?: string | null;
};

export default function BrowseProvidersPage() {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState<string>("");
  const [stateFilter, setStateFilter] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [selected, setSelected] = useState<Provider | null>(null);

  const router = useRouter();

  // Hire flow state
  const [hireMode, setHireMode] = useState(false);
  const [hireTitle, setHireTitle] = useState("");
  const [hireLoading, setHireLoading] = useState(false);

  // Reviews state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [myRating, setMyRating] = useState<number>(5);
  const [myComment, setMyComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const categoryOptions = useMemo(() => [{ slug: "", title: "All" }, ...allCategories.map(c => ({ slug: c.slug, title: c.title }))], []);

  const fetchProviders = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("profiles")
        .select("id, full_name, bio, categories, coverage_areas, services, avatar_url")
        .eq("role", "service-provider");

      if (q.trim()) {
        query = query.ilike("full_name", `%${q.trim()}%`);
      }
      if (category) {
        query = query.contains("categories", [category]);
      }
      if (stateFilter) {
        query = query.contains("coverage_areas", [stateFilter]);
      }

      const { data, error } = await query.limit(50);
      if (error) {
        setProviders([]);
      } else {
        const providerIds = data.map((p: any) => p.id);
        const { data: summaries, error: sumError } = await supabase
          .from("reviews_summary")
          .select("provider_id, avg_rating, review_count")
          .in("provider_id", providerIds);
        
        const ratingsMap = new Map((summaries || []).map((s: any) => [s.provider_id, { avg: s.avg_rating, count: s.review_count }]));
        setProviders(data.map((p: any) => ({
          ...p,
          avg_rating: ratingsMap.get(p.id)?.avg ?? null,
          review_count: ratingsMap.get(p.id)?.count ?? 0
        })));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load reviews when opening a provider modal
  // Corrected useEffect without duplication
  useEffect(() => {
    if (!selected) return;
    (async () => {
      setReviewsLoading(true);
      try {
        const [reviewsRes, summaryRes] = await Promise.all([
          supabase
            .from("reviews_view")
            .select("id, rating, comment, created_at, customer_name")
            .eq("provider_id", selected.id)
            .order("created_at", { ascending: false })
            .limit(10),
          supabase
            .from("reviews_summary")
            .select("avg_rating, review_count")
            .eq("provider_id", selected.id)
            .single()
        ]);

        // Load reviews from view if available
        let loaded: Review[] = [];
        if (!reviewsRes.error && Array.isArray(reviewsRes.data)) {
          loaded = (reviewsRes.data as Review[]) || [];
        }

        // Fallback: if no reviews or comments missing, query base reviews and join customer names
        if (loaded.length === 0 || loaded.every(r => !r.comment)) {
          const { data: base, error: baseErr } = await supabase
            .from("reviews")
            .select("id, customer_id, rating, comment, created_at")
            .eq("provider_id", selected.id)
            .order("created_at", { ascending: false })
            .limit(10);

          if (!baseErr && Array.isArray(base) && base.length > 0) {
            const customerIds = Array.from(new Set((base as any[]).map((r: any) => r.customer_id).filter(Boolean)));
            let nameById: Record<string, string> = {};
            if (customerIds.length > 0) {
              const { data: profs } = await supabase
                .from("profiles")
                .select("id, full_name")
                .in("id", customerIds);
              (profs || []).forEach((p: any) => {
                if (p && p.id) nameById[p.id] = p.full_name || "Anonymous";
              });
            }
            loaded = (base as any[]).map((r: any) => ({
              id: r.id,
              rating: r.rating,
              comment: r.comment || null,
              created_at: r.created_at,
              customer_name: nameById[r.customer_id] || null,
            }));
          }
        }

        setReviews(loaded);

        if (!summaryRes.error) {
          setSelectedAvg(summaryRes.data?.avg_rating ?? null);
          setSelectedReviewCount(summaryRes.data?.review_count ?? 0);
        }
      } finally {
        setReviewsLoading(false);
      }
    })();
  }, [selected]);

  

  const handleChat = () => {
    if (!selected) return;
    router.push(`/dashboard/messages?providerId=${selected.id}`);
  };

  const createEngagement = async () => {
    if (!selected) return;
    setHireLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const uid = sessionData.session?.user.id;
      if (!uid) {
        alert("Please log in to continue.");
        return;
      }
      const title = hireTitle.trim() || `Engagement with ${selected.full_name || "provider"}`;
      const { error } = await supabase.from("engagements").insert({
        customer_id: uid,
        provider_id: selected.id,
        title,
        status: "ongoing",
      });
      if (error) {
        alert(`Failed to create engagement: ${error.message}`);
        return;
      }
      setSelected(null);
      setHireMode(false);
      setHireTitle("");
      router.push("/dashboard/engagements");
    } finally {
      setHireLoading(false);
    }
  };

  // Add new states after reviews state
  const [selectedAvg, setSelectedAvg] = useState<number | null>(null);
  const [selectedReviewCount, setSelectedReviewCount] = useState<number>(0);

  const submitReview = async () => {
    if (!selected) return;
    setReviewSubmitting(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const uid = sessionData.session?.user.id;
      if (!uid) {
        alert("Please log in to review.");
        return;
      }
      const payload = {
        provider_id: selected.id,
        customer_id: uid,
        rating: myRating,
        comment: myComment.trim() || null,
      };
      const { error } = await supabase.from("reviews").insert(payload);
      if (error) {
        alert(`Failed to submit review: ${error.message}`);
        return;
      }
      setMyRating(5);
      setMyComment("");
      // Refresh reviews
      const { data } = await supabase
        .from("reviews_view")
        .select("id, rating, comment, created_at, customer_name")
        .eq("provider_id", selected.id)
        .order("created_at", { ascending: false })
        .limit(10);
      setReviews((data || []) as Review[]);
      
      // Refresh summary
      const { data: summary } = await supabase
        .from("reviews_summary")
        .select("avg_rating, review_count")
        .eq("provider_id", selected.id)
        .single();
      if (summary) {
        setSelectedAvg(summary.avg_rating ?? null);
        setSelectedReviewCount(summary.review_count ?? 0);
      }
    } finally {
      setReviewSubmitting(false);
    }
  };

  // Add debounce
  const debounceRef = useRef<number | null>(null);
  
  const debouncedFetch = () => {
    if (debounceRef.current !== null) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      fetchProviders();
    }, 300);
  };

  useEffect(() => {
    debouncedFetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, category, stateFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end gap-3">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Search by name</label>
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search providers…" />
        </div>
        <div className="w-full md:w-64">
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select className="w-full border rounded-md px-3 py-2" value={category} onChange={(e) => setCategory(e.target.value)}>
            {categoryOptions.map((c) => (
              <option key={c.slug} value={c.slug}>{c.title}</option>
            ))}
          </select>
        </div>
        <div className="w-full md:w-64">
          <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
          <select className="w-full border rounded-md px-3 py-2" value={stateFilter} onChange={(e) => setStateFilter(e.target.value)}>
            <option value="">All</option>
            {states.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div className="w-full md:w-auto">
          <Button onClick={fetchProviders} className="w-full md:w-auto bg-[#8C12AA] hover:bg-[#8C12AA]" disabled={loading}>{loading ? "Searching…" : "Search"}</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {providers.map((p) => (
          <Card key={p.id} className="hover:shadow-md transition cursor-pointer" onClick={() => { setSelected(p); setHireMode(false); }}>
            <CardHeader className="flex-row items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-700 overflow-hidden">
                {p.avatar_url ? (
                  <img src={p.avatar_url} alt={p.full_name || "Provider"} className="w-full h-full object-cover" />
                ) : (
                  getInitials(p.full_name)
                )}
              </div>
              <div>
                <div className="font-medium">{p.full_name || "Service Provider"}</div>
                <div className="text-sm text-gray-500">{(p.categories || []).map(c => allCategories.find(x => x.slug === c)?.title || c).join(", ")}</div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700 line-clamp-2">{p.bio || "No bio yet."}</p>
              <div className="text-xs text-gray-500 mt-2">Coverage: {(p.coverage_areas || []).join(", ") || "—"}</div>
              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="text-yellow-600">★ {p.avg_rating?.toFixed(1) ?? "–"} <span className="text-gray-500">({p.review_count ?? 0})</span></span>
                <Button className="bg-[#8C12AA] hover:bg-[#8C12AA]" onClick={(e) => { e.stopPropagation(); setSelected(p); setHireMode(false); }}>View</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-2 sm:p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-xl w-full max-w-2xl shadow-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-700 overflow-hidden">
                  {selected.avatar_url ? (
                    <img src={selected.avatar_url} alt={selected.full_name || "Provider"} className="w-full h-full object-cover" />
                  ) : (
                    getInitials(selected.full_name)
                  )}
                </div>
                <div>
                  <div className="font-semibold">{selected.full_name || "Service Provider"}</div>
                  <div className="text-sm text-gray-500">{(selected.categories || []).map(c => allCategories.find(x => x.slug === c)?.title || c).join(", ")}</div>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="p-4 space-y-4 overflow-y-auto max-h-[70vh]">
              <div>
                <div className="text-sm font-medium text-gray-900 mb-1">Bio</div>
                <p className="text-sm text-gray-700">{selected.bio || "No bio yet."}</p>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900 mb-1">Coverage area</div>
                <p className="text-sm text-gray-700">{(selected.coverage_areas || []).join(", ") || "—"}</p>
              </div>
              <div>
  <div className="text-sm font-medium text-gray-900 mb-1">Services Offered</div>
  <div className="flex flex-wrap gap-2">
    {Array.isArray(selected.services) && selected.services.length > 0 ? (
      selected.services.map((s) => (
        <span key={s} className="bg-gray-200 text-gray-800 text-sm px-2 py-1 rounded">
          {s}
        </span>
      ))
    ) : (
      <p className="text-sm text-gray-700">No services listed yet.</p>
    )}
  </div>
</div>
              <div className="flex items-center justify-between">
                <span className="text-yellow-600">★ {selectedAvg?.toFixed(1) ?? "–"} <span className="text-gray-500">({selectedReviewCount})</span></span>
                <div className="flex gap-2">
                  <Button className="bg-gray-900 hover:bg-black" onClick={handleChat}>Chat</Button>
                  <Button className="bg-[#8C12AA] hover:bg-[#8C12AA]" onClick={() => setHireMode(true)}>Hire</Button>
                </div>
              </div>

              {hireMode && (
                <div className="mt-2 border rounded-lg p-3">
                  <div className="text-sm font-medium mb-2">Create engagement</div>
                  <label className="block text-xs text-gray-600 mb-1">Title</label>
                  <Input value={hireTitle} onChange={(e) => setHireTitle(e.target.value)} placeholder={`e.g. ${selected.full_name ? `Hire ${selected.full_name}` : "New engagement"}`} />
                  <div className="flex gap-2 mt-3">
                    <Button disabled={hireLoading} className="bg-[#8C12AA] hover:bg-[#8C12AA]" onClick={createEngagement}>{hireLoading ? "Creating…" : "Confirm Hire"}</Button>
                    <Button variant="outline" onClick={() => { setHireMode(false); setHireTitle(""); }}>Cancel</Button>
                  </div>
                  <div className="text-xs text-gray-500 mt-2">This will create an engagement and take you to your engagements page.</div>
                </div>
              )}

              <div className="mt-2">
                <div className="text-sm font-medium text-gray-900 mb-2">Reviews</div>
                {reviewsLoading ? (
                  <div className="text-sm text-gray-600">Loading reviews…</div>
                ) : (
                  <div className="space-y-2">
                    {reviews.map((r) => (
                      <div key={r.id} className="border rounded-lg p-3">
                        <div className="text-sm font-medium text-gray-900">{r.customer_name || "Anonymous"}</div>
                        <div className="text-sm text-yellow-700">★ {r.rating}</div>
                        {r.comment && <div className="text-sm text-gray-800 mt-1">{r.comment}</div>}
                        <div className="text-xs text-gray-500 mt-1">{new Date(r.created_at).toLocaleString()}</div>
                      </div>
                    ))}
                    {reviews.length === 0 && <div className="text-sm text-gray-600">No reviews yet.</div>}
                  </div>
                )}

                <div className="mt-3 border-t pt-3">
                  <div className="text-sm font-medium mb-2">Rate this provider</div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-600">Rating</span>
                    <div className="flex items-center">
                      {[1,2,3,4,5].map((n) => (
                        <button
                          key={n}
                          type="button"
                          aria-label={`${n} star${n > 1 ? 's' : ''}`}
                          className="p-1"
                          onClick={() => setMyRating(n)}
                        >
                          <Star
                            size={18}
                            className={n <= myRating ? "text-yellow-500" : "text-gray-300"}
                            fill={n <= myRating ? "currentColor" : "none"}
                          />
                        </button>
                      ))}
                      <span className="ml-2 text-xs text-gray-600">{myRating} / 5</span>
                    </div>
                  </div>
                  <label className="block text-xs text-gray-600 mt-2 mb-1">Comment (optional)</label>
                  <textarea className="w-full border rounded-md px-3 py-2 min-h-[80px]" value={myComment} onChange={(e) => setMyComment(e.target.value)} placeholder="Share your experience…" />
                  <div className="mt-2">
                    <Button disabled={reviewSubmitting} onClick={submitReview} className="bg-gray-900 hover:bg-black">{reviewSubmitting ? "Submitting…" : "Post review"}</Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && providers.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center text-gray-600">No providers found</CardContent>
        </Card>
      )}
    </div>
  );
}
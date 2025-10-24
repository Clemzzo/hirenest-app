"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
// Removed: import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";

interface Review { id: string; customer_name: string | null; rating: number; comment: string | null; created_at: string }
// Removed: interface Reply { id: string; review_id: string; provider_id: string; content: string; created_at: string }

// Helper to render a 5-star visual for a given rating
function StarsRow({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1" aria-label={`Rating ${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${i <= Math.round(rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
        />
      ))}
      <span className="ml-1 text-sm text-gray-600">({rating.toFixed(1)})</span>
    </div>
  );
}

function Avatar({ name }: { name: string | null }) {
  const initials = (name || "Anonymous")
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div className="w-9 h-9 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-sm font-semibold">
      {initials || "A"}
    </div>
  );
}

// Helper: compare two dates by local calendar day (ignoring time)
function isSameLocalDate(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export default function ReviewsPage() {
  const [avg, setAvg] = useState<number>(0);
  const [allReviews, setAllReviews] = useState<Review[]>([]);
  // Removed: const [repliesByReview, setRepliesByReview] = useState<Record<string, Reply | null>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  // Removed: const [providerId, setProviderId] = useState<string>("");

  // Filters and sorting
  const [ratingFilter, setRatingFilter] = useState<number | 0>(0); // 0 = All
  const [dateOn, setDateOn] = useState<string>("");
  const [sort, setSort] = useState<"newest" | "highest" | "lowest">("newest");

  // Pagination
  const [visibleCount, setVisibleCount] = useState<number>(5);

  // Removed: Reply UI state
  // const [replyDraft, setReplyDraft] = useState<Record<string, string>>({});
  // const [replySubmitting, setReplySubmitting] = useState<string | null>(null);

  // Distribution (5..1)
  const distribution = useMemo(() => {
    const dist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const r of allReviews) {
      const s = Math.round(Number(r.rating) || 0) as 1 | 2 | 3 | 4 | 5;
      if (dist[s] !== undefined) dist[s]++;
    }
    return dist;
  }, [allReviews]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;
      if (!user) {
        setLoading(false);
        setError("You must be signed in to view reviews.");
        return;
      }
      // Removed: setProviderId(user.id);

      // Try to read average from summary (if it exists and permitted by RLS)
      let avgFromSummary: number | null = null;
      try {
        const { data: summary } = await supabase
          .from("reviews_summary")
          .select("avg_rating")
          .eq("provider_id", user.id)
          .single();
        if (summary && summary.avg_rating !== null && summary.avg_rating !== undefined) {
          avgFromSummary = Number(summary.avg_rating);
        }
      } catch (e: any) {
        // ignore
      }

      // Prefer reviews_view for convenient denormalized data
      let loadedReviews: Review[] = [];
      try {
        const { data: items, error: itemsErr } = await supabase
          .from("reviews_view")
          .select("id, customer_name, rating, comment, created_at")
          .eq("provider_id", user.id)
          .order("created_at", { ascending: false });
        if (!itemsErr && items && (items as any[]).length > 0) {
          loadedReviews = (items as Review[]) || [];
        }
      } catch (e: any) {
        // ignore
      }

      // Fallback: query base reviews table and join customer names from profiles
      if (loadedReviews.length === 0) {
        try {
          const { data: base, error: baseErr } = await supabase
            .from("reviews")
            .select("id, customer_id, rating, comment, created_at")
            .eq("provider_id", user.id)
            .order("created_at", { ascending: false });

          if (baseErr) throw baseErr;
          const rows = (base as any[] | null) || [];
          const customerIds = Array.from(new Set(rows.map((r: any) => r.customer_id).filter(Boolean)));

          let nameById: Record<string, string> = {};
          if (customerIds.length > 0) {
            const { data: profs, error: profErr } = await supabase
              .from("profiles")
              .select("id, full_name")
              .in("id", customerIds);
            if (profErr) throw profErr;
            nameById = Object.fromEntries(((profs as any[] | null) || []).map((p: any) => [p.id, p.full_name || ""])) as Record<string, string>;
          }

          loadedReviews = rows.map((r: any) => ({
            id: r.id,
            rating: Number(r.rating || 0),
            comment: r.comment ?? null,
            created_at: r.created_at,
            customer_name: nameById[r.customer_id] || null,
          }));
        } catch (e: any) {
          setError("Could not load reviews. Your database policies may be blocking access.");
        }
      }

      // Compute average locally if summary not available
      if (avgFromSummary === null && loadedReviews.length > 0) {
        const sum = loadedReviews.reduce((acc, r) => acc + Number(r.rating || 0), 0);
        avgFromSummary = sum / loadedReviews.length;
      }

      setAllReviews(loadedReviews);
      setAvg(Number(avgFromSummary || 0));

      // Removed: load existing provider replies
      // try {
      //   const reviewIds = loadedReviews.map((r) => r.id);
      //   if (reviewIds.length > 0) {
      //     const { data: replyRows } = await supabase
      //       .from("review_replies")
      //       .select("id, review_id, provider_id, content, created_at")
      //       .in("review_id", reviewIds)
      //       .eq("provider_id", user.id);
      //     const map: Record<string, Reply | null> = {};
      //     (replyRows || []).forEach((row: any) => {
      //       map[row.review_id] = row as Reply;
      //     });
      //     setRepliesByReview(map);
      //   }
      // } catch (e: any) {
      //   // table may not exist yet, ignore
      // }

      setLoading(false);
    })();
  }, []);

  const filteredSorted = useMemo(() => {
    let arr = [...allReviews];
    if (ratingFilter) arr = arr.filter((r) => Math.round(Number(r.rating)) === ratingFilter);
    if (dateOn) arr = arr.filter((r) => isSameLocalDate(new Date(r.created_at), new Date(dateOn)));

    if (sort === "newest") arr.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
    if (sort === "highest") arr.sort((a, b) => Number(b.rating) - Number(a.rating));
    if (sort === "lowest") arr.sort((a, b) => Number(a.rating) - Number(b.rating));

    return arr;
  }, [allReviews, ratingFilter, dateOn, sort]);

  const visible = filteredSorted.slice(0, visibleCount);
  const canLoadMore = visibleCount < filteredSorted.length;

  const clearFilters = () => {
    setRatingFilter(0);
    setDateOn("");
    setSort("newest");
    setVisibleCount(5);
  };

  // Removed: submitReply function
  // const submitReply = async (reviewId: string) => {
  //   if (!replyDraft[reviewId]?.trim()) return;
  //   setReplySubmitting(reviewId);
  //   try {
  //     const { error: insertErr, data } = await supabase
  //       .from("review_replies")
  //       .insert({ review_id: reviewId, provider_id: providerId, content: replyDraft[reviewId].trim() })
  //       .select()
  //       .single();
  //     if (insertErr) throw insertErr;
  //     const newReply = data as Reply;
  //     setRepliesByReview((prev) => ({ ...prev, [reviewId]: newReply }));
  //     setReplyDraft((prev) => ({ ...prev, [reviewId]: "" }));
  //   } catch (e: any) {
  //     alert("Failed to add reply. The review_replies table may not exist or RLS is blocking this action.");
  //   } finally {
  //     setReplySubmitting(null);
  //   }
  // };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <Card className="transition-all duration-200 hover:shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Star className="w-5 h-5 text-yellow-500" /> Ratings & Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-3 text-sm border border-red-300 bg-red-50 text-red-700 rounded p-2">
              {error}
            </div>
          )}
          <div className="flex items-center gap-3 text-3xl font-semibold">
            <Star className="w-7 h-7 text-yellow-500" />
            <span>{avg.toFixed(1)}</span>
          </div>
          <div className="text-sm text-gray-600 mt-1">Average rating from your customers</div>
          <div className="text-xs text-gray-500 mt-1">{allReviews.length} total review{allReviews.length === 1 ? "" : "s"}</div>

          {/* Rating distribution */}
          <div className="mt-4 space-y-1">
            {[5,4,3,2,1].map((s) => {
              const count = distribution[s as 1|2|3|4|5] || 0;
              const pct = allReviews.length ? Math.round((count / allReviews.length) * 100) : 0;
              return (
                <div key={s} className="flex items-center gap-2 text-sm">
                  <div className="w-10 text-right">{s}★</div>
                  <div className="flex-1 h-2 bg-gray-100 rounded">
                    <div className="h-2 bg-yellow-400 rounded" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="w-12 text-right text-gray-600">{count}</div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="transition-all duration-200 hover:shadow-sm">
        <CardHeader>
          <CardTitle>Recent Reviews</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Star rating</label>
              <select value={ratingFilter} onChange={(e) => setRatingFilter(Number(e.target.value))} className="w-full border rounded p-2 text-sm">
                <option value={0}>All ratings</option>
                <option value={5}>5 stars</option>
                <option value={4}>4 stars</option>
                <option value={3}>3 stars</option>
                <option value={2}>2 stars</option>
                <option value={1}>1 star</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Date</label>
              <input type="date" value={dateOn} onChange={(e) => setDateOn(e.target.value)} className="w-full border rounded p-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Sort</label>
              <select value={sort} onChange={(e) => setSort(e.target.value as any)} className="w-full border rounded p-2 text-sm">
                <option value="newest">Newest</option>
                <option value="highest">Highest rating</option>
                <option value="lowest">Lowest rating</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end">
            <Button variant="secondary" onClick={clearFilters}>Clear filters</Button>
          </div>

          {loading && (
            <div className="space-y-3">
              <div className="p-4 border rounded-lg bg-white animate-pulse">
                <div className="h-4 w-40 bg-gray-200 rounded" />
                <div className="h-3 w-3/4 bg-gray-100 rounded mt-2" />
                <div className="h-3 w-1/2 bg-gray-100 rounded mt-2" />
              </div>
              <div className="p-4 border rounded-lg bg-white animate-pulse">
                <div className="h-4 w-40 bg-gray-200 rounded" />
                <div className="h-3 w-3/4 bg-gray-100 rounded mt-2" />
                <div className="h-3 w-1/2 bg-gray-100 rounded mt-2" />
              </div>
            </div>
          )}

          {!loading && filteredSorted.length === 0 && (
            <div className="text-sm text-gray-600 border rounded p-3 bg-gray-50">
              No reviews match your filters. Try adjusting the filters above.
            </div>
          )}

          {!loading && visible.map((r) => (
            <div key={r.id} className="p-4 border rounded-lg hover:shadow transition-shadow bg-white space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3 flex-1">
                  <Avatar name={r.customer_name} />
                  <div className="min-w-0">
                    <div className="text-sm text-gray-500">Reviewed by</div>
                    <div className="font-semibold text-gray-900 truncate">{r.customer_name?.trim() || "Anonymous"}</div>
                    <div className="text-xs text-gray-500">{new Date(r.created_at).toLocaleString()}</div>
                  </div>
                </div>
                <StarsRow rating={Number(r.rating)} />
              </div>
              <div>
                <div className="text-sm text-gray-500">Comment</div>
                <div className="text-sm text-gray-800 mt-0.5">{r.comment?.trim() || "No comment provided."}</div>
              </div>

              {/* Removed provider reply section */}
              {/* Previously: showed existing reply or Textarea + Reply button */}
            </div>
          ))}

          {!loading && canLoadMore && (
            <div className="flex justify-center">
              <Button onClick={() => setVisibleCount((c) => c + 5)}>Load more</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
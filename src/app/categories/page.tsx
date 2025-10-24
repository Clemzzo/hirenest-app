"use client";

import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search as SearchIcon, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";

import { allCategories } from "@/lib/categories";

export default function CategoriesPage() {
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState<string>("All");

  const tags = useMemo(() => {
    const unique = Array.from(new Set(allCategories.map((c) => c.tag)));
    return ["All", ...unique];
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allCategories.filter((c) => {
      const matchesTag = activeTag === "All" || c.tag === activeTag;
      const matchesQuery = !q || c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q);
      return matchesTag && matchesQuery;
    });
  }, [query, activeTag]);

  return (
    <main className="min-h-screen">
      <Header />

      {/* Page Header Section with search */}
      <section className="pt-28 pb-10 px-4 bg-gray-50 border-b border-gray-100">
        <div className="container mx-auto max-w-6xl">
          <nav className="text-sm text-gray-500 mb-4">
            <Link href="/" className="hover:text-gray-700">Home</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-700 font-medium">Categories</span>
          </nav>

          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">All Categories</h1>
              <p className="text-gray-600 mt-2">Browse and explore our full list of services. Use search and filters to find exactly what you need.</p>
            </div>

            <div className="w-full md:w-[460px]">
              <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl p-2 shadow-sm">
                <SearchIcon className="w-5 h-5 text-gray-500 ml-1" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search categories..."
                  className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
                <Button className="bg-[#8C12AA] hover:bg-[#8C12AA] whitespace-nowrap">Search</Button>
              </div>
            </div>
          </div>

          {/* Filter chips */}
          <div className="mt-6 overflow-x-auto">
            <div className="flex items-center gap-2 min-w-max">
              {tags.map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveTag(t)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                    activeTag === t
                      ? "bg-[#8C12AA] text-white border-[#8C12AA]"
                      : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Main Grid */}
      <section className="py-12 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-gray-500">Showing <span className="font-medium text-gray-700">{filtered.length}</span> of {allCategories.length} categories</p>
            <div className="hidden md:flex items-center gap-2 text-sm text-gray-600">
              <span>Can’t find your category?</span>
              <Link href="#" className="text-[#8C12AA] hover:text-[#8C12AA] font-medium">Request a category</Link>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map((category) => {
              const Icon = category.icon;
              return (
                <Link key={category.slug} href={`/categories/${category.slug}`} prefetch={false} className="group">
                  <Card className="h-full overflow-hidden transition-all duration-300 group-hover:shadow-lg">
                    <div className="relative h-36 w-full overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-[#FAF0FD] to-[#F3E3F8]" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className={`w-14 h-14 rounded-xl ${category.color} flex items-center justify-center shadow-sm`}>
                          <Icon className="w-7 h-7" />
                        </div>
                      </div>
                    </div>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg font-semibold text-gray-900">{category.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-gray-600">{category.description}</CardDescription>
                      <div className="mt-4 flex items-center gap-2 text-sm font-medium text-[#8C12AA]">
                        <span>Explore</span>
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>

          {/* Bottom Callout on small screens */}
          <div className="md:hidden mt-8 text-center text-sm text-gray-600">
            Can’t find your category?{" "}
            <Link href="#" className="text-[#8C12AA] hover:text-[#8C12AA] font-medium">Request a category</Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
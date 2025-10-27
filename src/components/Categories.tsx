"use client";

import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const categories = [
  {
    title: "Web Developer",
    description: "Custom websites & web applications",
    img: "/categories/web-developer.svg",
    color: "bg-[#F7E6FB] text-[#8C12AA]",
  },
  {
    title: "Mobile App Developer",
    description: "iOS & Android app development",
    img: "/categories/mobile-app-developer.svg",
    color: "bg-green-100 text-green-600",
  },
  {
    title: "UI/UX Designer",
    description: "User interface & experience design",
    img: "/categories/ui-ux-designer.svg",
    color: "bg-purple-100 text-purple-600",
  },
  {
    title: "Graphic Designer",
    description: "Branding & visual design",
    img: "/categories/graphic-designer.svg",
    color: "bg-pink-100 text-pink-600",
  },
  {
    title: "Photographer",
    description: "Professional photography services",
    img: "/categories/photographer.svg",
    color: "bg-yellow-100 text-yellow-600",
  },
  {
    title: "Caterer",
    description: "Event catering & food services",
    img: "/categories/caterer.svg",
    color: "bg-orange-100 text-orange-600",
  },
  {
    title: "Architect",
    description: "Building design & planning",
    img: "/categories/architect.svg",
    color: "bg-[#F7E6FB] text-[#8C12AA]",
  },
];

const Categories = () => {
  return (
    <section id="categories" className="py-16 px-4 bg-white">
      <div className="container mx-auto max-w-6xl" suppressHydrationWarning>
        <div className="text-center mb-12 animate-fade-in" suppressHydrationWarning>
          <h2 className="text-3xl md:text-4xl font-bold text-[#AD15B0] mb-4">
            Popular Categories
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Browse through our most popular service categories and find the perfect professional for your needs.
          </p>
          {/* removed top-positioned link */}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-slide-up" suppressHydrationWarning>
          {categories.map((category) => (
            <Card
              key={category.title}
              className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer group"
            >
              <CardHeader className="pb-2">
                <div
                  className={`w-14 h-14 rounded-xl ${category.color} flex items-center justify-center mb-3 shadow-sm group-hover:scale-110 transition-transform`}
                  suppressHydrationWarning
                >
                  <Image
                    src={category.img}
                    alt={category.title}
                    width={28}
                    height={28}
                    unoptimized
                  />
                </div>
                <CardTitle className="text-lg font-semibold text-gray-900">
                  {category.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 text-sm">
                  {category.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8 text-center" suppressHydrationWarning>
          <Link
            href="/categories"
            aria-label="View all categories"
            className="inline-flex items-center justify-center gap-2 text-[#8C12AA] font-medium hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8C12AA]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white rounded-md group"
          >
            <span>View all categories</span>
            <svg
              className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Categories;
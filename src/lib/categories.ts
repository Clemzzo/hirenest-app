import type { LucideIcon } from "lucide-react";
import { Code, Smartphone, Palette, Image as ImageIcon, Camera, Utensils, Building, GraduationCap, Scissors } from "lucide-react";

export type Category = {
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
  tag: string;
  slug: string;
};

export const allCategories: Category[] = [
  {
    title: "Web Developer",
    description: "Custom websites & web applications",
    icon: Code,
    color: "bg-[#F7E6FB] text-[#8C12AA]",
    tag: "Development",
    slug: "web-developer",
  },
  {
    title: "Mobile App Developer",
    description: "iOS & Android app development",
    icon: Smartphone,
    color: "bg-green-100 text-green-600",
    tag: "Development",
    slug: "mobile-app-developer",
  },
  {
    title: "UI/UX Designer",
    description: "User interface & experience design",
    icon: Palette,
    color: "bg-purple-100 text-purple-600",
    tag: "Design",
    slug: "ui-ux-designer",
  },
  {
    title: "Graphic Designer",
    description: "Branding & visual design",
    icon: ImageIcon,
    color: "bg-pink-100 text-pink-600",
    tag: "Design",
    slug: "graphic-designer",
  },
  {
    title: "Photographer",
    description: "Professional photography services",
    icon: Camera,
    color: "bg-yellow-100 text-yellow-600",
    tag: "Creative",
    slug: "photographer",
  },
  {
    title: "Caterer",
    description: "Event catering & food services",
    icon: Utensils,
    color: "bg-orange-100 text-orange-600",
    tag: "Events",
    slug: "caterer",
  },
  {
    title: "Architect",
    description: "Building design & planning",
    icon: Building,
    color: "bg-[#F7E6FB] text-[#8C12AA]",
    tag: "Architecture",
    slug: "architect",
  },
  // Added new category: Tech Skills Development Training
  {
    title: "Tech Skills Development Training",
    description: "Hands-on training in modern technical and digital skills",
    icon: GraduationCap,
    color: "bg-blue-100 text-blue-600",
    tag: "Training",
    slug: "tech-skills-development-training",
  },
  // Added new category: Hair Stylist
  {
    title: "Hair Stylist",
    description: "Professional hair styling and salon services",
    icon: Scissors,
    color: "bg-red-100 text-red-600",
    tag: "Beauty",
    slug: "hair-stylist",
  },
];

export function getCategoryBySlug(slug: string): Category | undefined {
  return allCategories.find((c) => c.slug === slug);
}
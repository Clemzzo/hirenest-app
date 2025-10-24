import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getCategoryBySlug, allCategories } from "@/lib/categories";
import { ShieldCheck, Award, Clock, ThumbsUp, CheckCircle, HelpCircle, FolderOpen, Users, Star } from "lucide-react";

export async function generateStaticParams() {
  return allCategories.map((c) => ({ slug: c.slug }));
}

export default async function CategoryExplorePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);

  if (!category) {
    return (
      <main className="min-h-screen">
        <Header />
        <section className="pt-28 pb-10 px-4">
          <div className="container mx-auto max-w-6xl">
            <h1 className="text-2xl font-semibold">Category not found</h1>
            <p className="text-gray-600 mt-2">The category you’re looking for doesn’t exist.</p>
            <Link href="/categories" className="text-[#8C12AA] font-medium mt-4 inline-block">Back to Categories</Link>
          </div>
        </section>
        <Footer />
      </main>
    );
  }

  const Icon = category.icon;

  const isGraphic = category.slug === "graphic-designer";
  // Add training flag for conditional content
  const isTraining = category.slug === "tech-skills-development-training";
  const isHairStylist = category.slug === "hair-stylist";
  const isCaterer = category.slug === "caterer";
  const isUIUX = category.slug === "ui-ux-designer";
  const isWebDev = category.slug === "web-developer";


  // Tag-based skills and example work to tailor content per category
  const skillsByTag: Record<string, string[]> = {
    Development: ["HTML/CSS", "JavaScript", "Frontend Frameworks (e.g., React, Vue)", "Backend Development (e.g., Node.js)", "APIs & Integrations", "Database Management", "Version Control (Git)", "Responsive UI", "Performance Optimization", "Security Best Practices", "SEO", "Testing & Debugging"],
    Design: ["Figma & Prototyping", "User Research", "Design Systems", "Accessibility", "Brand Consistency"],
    Creative: ["Studio & Outdoor", "Event Coverage", "Photo Editing", "Lighting", "Storytelling"],
    Events: ["Menu Planning", "Logistics", "Hygiene & Safety", "On‑time Delivery", "Presentation"],
    Architecture: ["Concept Design", "3D Rendering", "CAD Drafting", "Regulatory Codes", "Project Supervision"],
    // Added Training tag skills for Tech Skills Development Training
    Training: [
      "UI/UX Design",
      "Mobile App Development",
      "Web Development",
      "Technical support Assistant",
      "Graphic Design",
    ],
  };
  const examplesByTag: Record<string, {title: string; desc?: string}[]> = {
    Development: [
      {title: "Business website", desc: "Build professional sites for businesses with custom features, responsive design, and SEO optimization."},
      {title: "E-commerce store", desc: "Develop online stores with secure payments, product catalogs, and user-friendly shopping experiences."},
      {title: "Landing page", desc: "Create high-converting landing pages optimized for marketing campaigns and lead generation."},
      {title: "Admin dashboard", desc: "Design secure admin panels for managing content, users, and analytics with intuitive interfaces."}
    ],
    Design: [
      {title: "Mobile app UI", desc: "Design intuitive user interfaces for mobile applications, focusing on touch interactions, navigation flows, and responsive layouts across devices."},
      {title: "Website redesign", desc: "Revamp existing websites with modern UI/UX principles, improving user engagement, accessibility, and overall performance."},
      {title: "Design system", desc: "Create comprehensive design systems including components, style guides, and patterns for consistent branding and efficient development."},
      {title: "Brand refresh", desc: "Update brand visuals with fresh UI elements, color palettes, and typography to align with current trends and business goals."}
    ],
    Creative: [
      {title: "Wedding coverage", desc: "Capture the essence of your special day with comprehensive wedding photography, including pre-wedding shoots, ceremony coverage, and reception highlights, complete with professional editing."},
      {title: "Portrait session", desc: "Create stunning portraits that capture personality and emotion, suitable for professional headshots, family photos, or artistic expressions, with expert lighting and post-processing."},
      {title: "Product shoot", desc: "Showcase your products in the best light with high-quality photography, including multiple angles, styling, and editing to enhance appeal for e-commerce or marketing materials."},
      {title: "Event recap", desc: "Document events with dynamic photography that captures key moments, atmosphere, and details, providing a complete visual recap for corporate events, parties, or conferences."}
    ],
    Events: [
      {title: "Corporate lunch", desc: "Professional catering for business meetings and corporate events, featuring customized menus with fresh, high-quality ingredients to impress clients and colleagues."},
      {title: "Wedding catering", desc: "Elegant and personalized catering services for weddings, including menu planning, setup, and service to make your special day unforgettable."},
      {title: "Private chef", desc: "Hire a private chef for intimate dinners or special occasions, with bespoke menus tailored to your preferences and dietary needs."},
      {title: "Outdoor buffet", desc: "Delicious buffet-style catering for outdoor events, complete with setup, serving, and cleanup for a hassle-free experience."}
    ],
    Architecture: [
      {title: "Residential plan", desc: "Comprehensive architectural plans for homes, including floor layouts, elevations, sections, and material specifications to bring your dream residence to life."},
      {title: "Office layout", desc: "Efficient office space designs that optimize workflow, incorporate ergonomic principles, and maximize natural light for productive work environments."},
      {title: "Facade redesign", desc: "Innovative exterior redesigns that enhance building aesthetics, improve energy efficiency, and integrate modern materials while preserving structural integrity."},
      {title: "3D walkthrough", desc: "Immersive 3D virtual tours of proposed designs, allowing clients to experience and navigate through spaces before construction begins."}
    ],
  };

  // Graphic Designer specialization
  const graphicSkills = [
    "Logo design",
    "Brand identity",
    "Typography",
    "Color theory",
    "Layout & composition",
    "Print design (CMYK, bleed)",
    "Social media graphics",
    "Presentation design",
    "Packaging & dielines",
    "Export prep (SVG/PNG/PDF)",
  ];

  const graphicExamples = [
    { title: "Logo & brand guidelines", desc: "Custom logos with style guides for colors, fonts, and usage." },
    { title: "Business cards & stationery", desc: "Professional designs for cards, letterheads, and envelopes." },
    { title: "Social media kit", desc: "Templates for posts, stories, and profiles on social platforms." },
    { title: "Pitch deck / presentation", desc: "Engaging slides with visuals for business presentations." },
    { title: "Marketing collateral (flyers/posters)", desc: "Eye-catching designs for flyers and posters." },
    { title: "Packaging mockups", desc: "Realistic 3D mockups and labels for products." },
    { title: "Website hero graphics", desc: "Striking header images optimized for websites." },
    { title: "Infographics", desc: "Visual data representations that simplify complex info." }
  ];

  const hairStylistSkills = [
    "Ghana weaving",
    "Cornrows",
    "Installation",
    "Dread locking",
    "Wigging",
    "Braids",
    "Gel pack",
    "Ventilation etc",
  ];

  const hairStylistExamples = [
    "Bridal Updo",
    "Color Correction",
    "Layered Cut",
    "Perm & Relaxer",
    "Keratin Treatment",
    "Men's Fade",
    "Highlight Service",
    "Wedding Party Styling",
];

const mobileSkills = [
  "iOS Development (Swift/Objective-C)",
  "Cross-platform Frameworks (Flutter, React Native)",
  "Mobile UI/UX Design",
  "API Integration",
  "Offline Functionality",
  "Push Notifications",
  "Device Integration (Camera, GPS)",
  "Performance Optimization",
  "App Security",
  "Testing & Debugging",
  "App Store Deployment"
];
const isMobileDev = category.slug === "mobile-app-developer";
const skills = isMobileDev ? mobileSkills : isGraphic ? graphicSkills : isHairStylist ? hairStylistSkills : isCaterer ? ["Kilishi", "Small chops", "Jollofrice in liters and for events", "Fried rice in liters and for events", "Igbo soups in liters"] : (skillsByTag[category.tag] ?? ["Professional delivery", "Clear communication", "On‑time"]);
const topSkills = isMobileDev ? mobileSkills : isGraphic ? graphicSkills : isHairStylist ? hairStylistSkills : (skillsByTag[category.tag] ?? ["Professional delivery", "Clear communication", "On‑time"]);
const exampleProjects = isGraphic ? graphicExamples : isHairStylist ? hairStylistExamples.map(ex => ({title: ex, desc: undefined})) : (examplesByTag[category.tag] ?? [{title: "Sample project A"}, {title: "Sample project B"}, {title: "Sample project C"}]);


  const whatYouGet = isGraphic
    ? "Includes source files (AI/PSD), print‑ready PDFs, and web exports (PNG, SVG)."
    : "What you’ll get: planning, delivery, and revisions agreed upfront.";

  const defaultFaqs = [
    { q: "How soon can I get started?", a: "Most projects can begin within a few days after scope alignment. Matching may be faster for common requests." },
    { q: "Can I see past work?", a: "Yes. Many professionals include portfolio samples and reviews on their profiles." },
    { q: "What if my scope changes?", a: "You can agree on updated milestones and pricing directly in chat to keep everything transparent." },
  ];

  const graphicFaqs = [
    { q: "Do I get source files (AI/PSD/SVG)?", a: "Yes—upon completion you can request editable source files along with exports for web and print." },
    { q: "How many concepts and revisions are included?", a: "Typical logo or brand packages include 2–3 concepts and a set number of revisions. You can clarify expectations upfront." },
    { q: "Can you deliver for both print and digital?", a: "Absolutely. Designers can prepare print‑ready PDFs (with bleed/CMYK) and web assets (PNG/JPG/SVG) in required sizes." },
  ];

  const hairStylistFaqs = [
    { q: "What types of braiding styles do you offer?", a: "We specialize in various braiding styles including Ghana weaving, cornrows, box braids, and traditional African braiding techniques." },
    { q: "How long does Ghana weaving or cornrows take?", a: "Ghana weaving typically takes 3-5 hours depending on the style complexity, while cornrows can take 30 minutes to 1 hour without extension, with extension, 2 to 4 hours based on the pattern and length." },
    { q: "Do you provide hair extensions and installation services?", a: "Yes, we offer professional hair extension installation including weaves, wigs, and various protective styling options." },
    { q: "What hair care products do you recommend for maintaining braids?", a: "We recommend using light oils, leave-in conditioners, and gentle cleansing products specifically designed for braided and protective styles." },
    { q: "Do you offer dreadlock services and maintenance?", a: "Yes, we provide dreadlock installation, maintenance, and styling services using professional techniques and quality products." },
    { q: "Can you work with all hair types and textures?", a: "Absolutely! Our stylists are experienced in working with all hair types and textures, specializing in natural African hair care and styling." },
  ];

  const catererFaqs = [
  { q: "What types of events do you cater for?", a: "We cater for a variety of events including weddings, corporate functions, private parties, and more, with customizable menus." },
  { q: "How do you handle dietary restrictions and allergies?", a: "We work closely with clients to accommodate dietary needs such as vegetarian, vegan, gluten-free, and specific allergies – please inform us in advance." },
  { q: "What is the minimum order size for catering?", a: "Minimum order sizes vary depending on the event type and menu, but we can discuss flexible options to suit your needs." },
];
const mobileFaqs = [
  { q: "What platforms do you develop for?", a: "We specialize in iOS, Android, and cross-platform development using frameworks like Flutter and React Native." },
  { q: "How long does app development take?", a: "Timeline varies by complexity, typically 4-12 weeks for MVP, with detailed planning upfront." },
  { q: "Do you handle app store submission?", a: "Yes, we guide through the submission process for Apple App Store and Google Play Store." },
];
const faqs = isGraphic ? graphicFaqs : isHairStylist ? hairStylistFaqs : isCaterer ? catererFaqs : isMobileDev ? mobileFaqs : isUIUX ? uiuxFaqs : isWebDev ? webDevFaqs : defaultFaqs;




  return (
    <main className="min-h-screen">
      <Header />

      <section className="pt-28 pb-10 px-4 bg-gray-50 border-b border-gray-100">
        <div className="container mx-auto max-w-6xl">
          <nav className="text-sm text-gray-500 mb-4">
            <Link href="/" className="hover:text-gray-700">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/categories" className="hover:text-gray-700">Categories</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-700 font-medium">{category.title}</span>
          </nav>

          <div className="flex items-start justify-between gap-6">
            <div>
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl ${category.color} flex items-center justify-center shadow-sm`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-gray-900">{category.title}</h1>
                  <p className="text-gray-600 mt-1">{category.description}</p>
                </div>
              </div>
            </div>
            <div className="hidden md:block">
              <Button asChild className="bg-[#8C12AA] hover:bg-[#8C12AA]/90">
                <Link href="/signup">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 px-4 bg-white">
        <div className="container mx-auto max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            {/* Why choose section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-[#8C12AA]" /> {isTraining ? "Why hire a Tech Skills Development Trainer on Hirenest?" : isHairStylist ? "Why hire a Hair Stylist on Hirenest?" : `Why hire a ${category.title} on Hirenest?`}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <ThumbsUp className="h-5 w-5 text-[#8C12AA] mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">Verified professionals</p>
                      <p className="text-gray-600 text-sm">{isTraining ? "Trainers are verified for industry experience and curriculum quality, with feedback from past learners." : isHairStylist ? "Stylists are verified for expertise in cutting, coloring, and styling techniques, with client reviews." : isCaterer ? "Caterers are verified for culinary skills, hygiene certifications, and event catering experience, backed by client reviews." : "Profiles are reviewed for quality, with ratings and past work to help you decide confidently."}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Award className="h-5 w-5 text-[#8C12AA] mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">Quality you can trust</p>
                      <p className="text-gray-600 text-sm">{isTraining ? "Structured learning paths with clear outcomes, and transparent learner reviews to validate impact." : isHairStylist ? "High-quality services using premium products, with satisfaction guaranteed through reviews." : isCaterer ? "High-quality catering using fresh ingredients, customized menus, and reliable service, with satisfaction guaranteed through transparent feedback." : "Transparent reviews and messaging keep expectations aligned from start to finish."}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Users className="h-5 w-5 text-[#8C12AA] mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">Built for collaboration</p>
                      <p className="text-gray-600 text-sm">{isTraining ? "Plan sessions, share materials, and track learner progress with milestones and messaging." : isHairStylist ? "Personal consultations to understand your vision, with follow-up care advice." : isCaterer ? "Collaborate on menu planning, event logistics, and special dietary needs with easy messaging and milestone tracking." : "Chat, agree on scope, and track progress so your project stays on schedule."}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* About service (richer) */}
            <Card>
              <CardHeader>
                <CardTitle>About this service</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <CardDescription>
                  {isGraphic
                    ? "A professional graphic designer brings your brand to life through logos, visual identity, and marketing assets—balancing typography, color, and layout for print and digital."
                    : isHairStylist 
                      ? "A professional hair stylist transforms your look with expert cutting, coloring, and styling techniques, using quality products for healthy, beautiful hair."
                      : isCaterer
                        ? "A professional caterer creates memorable dining experiences with customized menus, fresh ingredients, and impeccable service for events of all sizes."
                        : <>A seasoned {category.title.toLowerCase()} helps you translate ideas into concrete outcomes. From planning to delivery, expect clear communication, structured milestones, and outcomes aligned with your goals.</>}
                </CardDescription>
                <ul className="grid md:grid-cols-2 gap-3 text-gray-700">
                  {skills.map((s) => (
                    <li key={s} className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-[#8C12AA]" /> {s}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>


            {/* Portfolio ideas */}
            {!isTraining && !isHairStylist && !isMobileDev && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><FolderOpen className="h-5 w-5 text-[#8C12AA]" /> Portfolio ideas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {exampleProjects.map((ex) => (
                    <div key={ex.title} className="border rounded-lg p-3 hover:shadow-sm transition">
                      <p className="text-sm font-medium text-gray-900">{ex.title}</p>
                      <p className="text-xs text-gray-600">{ex.desc ?? whatYouGet}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            )}
            {/* Process */}
            <Card>
              <CardHeader>
                <CardTitle>How it works</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-3 text-gray-700">
                  <li className="flex gap-3"><span className="font-semibold text-gray-900">1.</span> Share your goals and budget</li>
                  <li className="flex gap-3"><span className="font-semibold text-gray-900">2.</span> Get matched and discuss the scope</li>
                  <li className="flex gap-3"><span className="font-semibold text-gray-900">3.</span> Approve milestones and get to work</li>
                  <li className="flex gap-3"><span className="font-semibold text-gray-900">4.</span> Review deliverables and wrap up</li>
                </ol>
              </CardContent>
            </Card>

            {/* FAQs */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><HelpCircle className="h-5 w-5 text-[#8C12AA]" /> FAQs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {faqs.map((item) => (
                  <details key={item.q} className="group border rounded-lg p-3">
                    <summary className="cursor-pointer font-medium text-gray-900">{item.q}</summary>
                    <p className="text-sm text-gray-700 mt-2">{item.a}</p>
                  </details>
                ))}
              </CardContent>
            </Card>

          </div>

          <div className="space-y-6">
            {/* Skills chip list */}
            <Card>
              <CardHeader>
                <CardTitle>Top skills</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {topSkills.map((s) => (
                    <span key={s} className="px-3 py-1 text-xs rounded-full border bg-gray-50 text-gray-700">{s}</span>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Trust stats */}
            <Card>
              <CardHeader>
                <CardTitle>Why customers choose us</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-gray-700">
                <div className="flex items-center gap-3"><Star className="h-4 w-4 text-[#8C12AA]" /> 4.8/5 average rating</div>
                <div className="flex items-center gap-3"><Clock className="h-4 w-4 text-[#8C12AA]" /> Typically matched in 24–72 hours</div>
                <div className="flex items-center gap-3"><ShieldCheck className="h-4 w-4 text-[#8C12AA]" /> Secure messaging & agreements</div>
              </CardContent>
            </Card>


          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

const uiuxFaqs = [
  { q: "What is the difference between UI and UX design?", a: "UI focuses on the visual and interactive elements of a product, while UX emphasizes the overall user experience, usability, and journey." },
  { q: "How long does a typical UI/UX design project take?", a: "Timelines vary by scope, but most projects take 4-12 weeks, including research, wireframing, prototyping, and iterations based on feedback." },
  { q: "What tools do you use for UI/UX design?", a: "Common tools include Figma, Adobe XD, Sketch for design and prototyping, along with InVision or Proto.io for interactive mockups." }
];
const webDevFaqs = [
  { q: "What programming languages and frameworks do you specialize in?", a: "Our web developers typically work with HTML, CSS, JavaScript, and frameworks like React, Angular, Node.js, and more, depending on project needs." },
  { q: "How long does a typical web development project take?", a: "Project timelines vary based on complexity, but a standard website can take 4-8 weeks, including planning, development, testing, and deployment." },
  { q: "Do you provide ongoing maintenance and support after development?", a: "Yes, many developers offer maintenance packages for updates, security patches, and feature additions post-launch." }
];
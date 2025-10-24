"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Eye, EyeOff } from "lucide-react";
import { SignUpHeader } from "@/components/SignUpHeader";
import { supabase } from "@/lib/supabaseClient";
import { ProfileCompletionModal } from "@/components/ui/modal";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { allCategories } from "@/lib/categories";

const createBaseSchema = () => z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  phone: z.string().min(7, "Please enter a valid phone number"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["customer", "service-provider"]),
});

const createServiceProviderSchema = () => createBaseSchema().extend({
  categories: z.array(z.string()).min(1, "Please select at least one skill category"),
  coverageAreas: z.array(z.string()).min(1, "Please select at least one coverage area"),
  bio: z.string().min(50, "Bio must be at least 50 characters").max(500, "Bio must not exceed 500 characters"),
});

// Form data types
type BaseFormData = z.infer<ReturnType<typeof createBaseSchema>>;
type ServiceProviderFormData = z.infer<ReturnType<typeof createServiceProviderSchema>>;

// Nigerian states data
const nigerianStates = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno", "Cross River", "Delta",
  "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT - Abuja", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano",
  "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun",
  "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara"
];

export default function SignUpPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentRole, setCurrentRole] = useState("customer");
  const [providerStep, setProviderStep] = useState(1);
  const [coverageOpen, setCoverageOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const form = useForm<BaseFormData | ServiceProviderFormData>({
    resolver: zodResolver(currentRole === "service-provider" ? createServiceProviderSchema() : createBaseSchema()),
    defaultValues: {
      fullName: "",
      phone: "",
      email: "",
      password: "",
      role: "customer",
    },
  });

  const watchRole = form.watch("role");
  
  // Update currentRole when watchRole changes
  useEffect(() => {
    setCurrentRole(watchRole);
  }, [watchRole]);

  // Update schema when role changes
  useEffect(() => {
    if (currentRole === "service-provider") {
      setProviderStep(1);
      form.reset({
        ...form.getValues(),
        categories: [],
        coverageAreas: [],
        bio: "",
      } as ServiceProviderFormData);
    }
  }, [currentRole, form]);

  useEffect(() => {
    if (!successToast) return;
    const t = setTimeout(() => setSuccessToast(null), 4000);
    return () => clearTimeout(t);
  }, [successToast]);

  // Check for authenticated users (handles regular authentication)
  useEffect(() => {
    let mounted = true;
    
    const checkAuth = async () => {
      // Check if already authenticated (regular case)
      const { data } = await supabase.auth.getUser();
      if (!mounted) return;
      
      const user = data.user;
      if (user) {
        // Regular login - redirect to dashboard
        const role = user.user_metadata?.role as string | undefined;
        router.replace(
          role === "provider" || role === "service-provider" ? "/provider" : "/dashboard"
        );
      }
    };
    
    checkAuth();
    
    return () => {
      mounted = false;
    };
  }, [router]);

  const onSubmit = async (data: BaseFormData | ServiceProviderFormData) => {
    setIsLoading(true);
    try {
      const base = data as BaseFormData;
      const isProvider = base.role === "service-provider";

      const metadata: Record<string, unknown> = {
        full_name: base.fullName,
        phone_number: base.phone,
        role: base.role,
      };

      if (isProvider) {
        const sp = data as ServiceProviderFormData;
        metadata.bio = sp.bio;
        metadata.categories = sp.categories;
        metadata.coverage_areas = sp.coverageAreas;
      }

      // Regular signup
      const emailRedirectTo = `${window.location.origin}/verify?email=${encodeURIComponent(base.email)}`;

      const { error } = await supabase.auth.signUp({
        email: base.email,
        password: base.password!,
        options: {
          data: metadata,
          emailRedirectTo,
        },
      });

      if (error) {
        form.setError("email", { message: error.message });
        return;
      }
 
      setSuccessToast("Account created! Please check your email to verify your account.");
      // Navigate user to verification page so they can see instructions and resend link if needed
      router.push(`/verify?email=${encodeURIComponent(base.email)}`);
    } catch (error) {} finally {
      setIsLoading(false);
    }
  };

  const handleNextFromStep1 = async () => {
    const valid = await form.trigger(["fullName", "phone", "email", "password"]);
    if (valid) setProviderStep(2);
  };
  const handleNextFromStep2 = async () => {
    const valid = await form.trigger(["categories"]);
    if (valid) setProviderStep(3);
  };
  const handleNextFromStep3 = async () => {
    const valid = await form.trigger(["coverageAreas"]);
    if (valid) setProviderStep(4);
  };

  const selectedAreas = (form.watch("coverageAreas") as string[] | undefined) || [];
  const selectedCategories = (form.watch("categories") as string[] | undefined) || [];

  return (
    <div className="min-h-screen bg-white relative">
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
              Ã—
            </button>
          </div>
        </div>
      )}
      <SignUpHeader />
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md animate-fade-in">
          {/* Header */}
          <div className="text-center mb-8 pt-16 animate-slide-up">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Join HireNestly</h1>
            <p className="text-gray-600">Connect with trusted professionals in Nigeria</p>
          </div>

        <Card className="border-0 shadow-xl animate-scale-in">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-[#8C12AA]">
              Create Account
            </CardTitle>
            <CardDescription>
              Choose your role to get started
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Role Selection */}
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>I am a...</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="grid grid-cols-2 gap-4"
                        >
                          <div>
                            <RadioGroupItem value="customer" id="customer" className="peer sr-only" />
                            <label
                              htmlFor="customer"
                              className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-all hover:scale-105"
                            >
                              <span className="text-sm font-medium">Customer</span>
                              <span className="text-xs text-muted-foreground text-center mt-1">Looking for services</span>
                            </label>
                          </div>
                          <div>
                            <RadioGroupItem value="service-provider" id="service-provider" className="peer sr-only" />
                            <label
                              htmlFor="service-provider"
                              className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-all hover:scale-105"
                            >
                              <span className="text-sm font-medium">Service Provider</span>
                              <span className="text-xs text-muted-foreground text-center mt-1">Offering services</span>
                            </label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Customer Flow: Basic Fields + Submit */}
                {watchRole !== "service-provider" && (
                  <>
                    <FormField
                      control={form.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input placeholder="+234 801 234 5678" type="tel" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="john@example.com" type="email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input 
                                placeholder="Enter your password" 
                                type={showPassword ? "text" : "password"} 
                                {...field} 
                              />
                              <button
                                type="button"
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                onClick={() => setShowPassword(!showPassword)}
                              >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" className="w-full bg-[#8C12AA] hover:bg-[#8C12AA]" disabled={isLoading}>
                      {isLoading ? "Creating Account..." : "Create Account"}
                    </Button>


                  </>
                )}

                {/* Service Provider Flow: Stepper */}
                {watchRole === "service-provider" && (
                  <div className="space-y-6 animate-slide-up">
                    {/* Step Indicator */}
                    <div className="flex items-center justify-between mb-2">
                      {[1,2,3,4].map((s, i) => (
                        <div key={s} className="flex-1 flex items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${providerStep >= s ? 'bg-[#8C12AA] text-white' : 'bg-gray-200 text-gray-600'}`}>{s}</div>
                          {i < 3 && <div className={`h-1 flex-1 mx-2 rounded ${providerStep > s ? 'bg-[#8C12AA]' : 'bg-gray-200'}`}></div>}
                        </div>
                      ))}
                    </div>

                    {/* Step 1: Basic Info */}
                    {providerStep === 1 && (
                      <div className="space-y-6">
                        <FormField
                          control={form.control}
                          name="fullName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="mt-[15px]">Full Name</FormLabel>
                              <FormControl>
                                <Input placeholder="John Doe" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone Number</FormLabel>
                              <FormControl>
                                <Input placeholder="+234 801 234 5678" type="tel" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input placeholder="john@example.com" type="email" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Password</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input 
                                    placeholder="Enter your password" 
                                    type={showPassword ? "text" : "password"} 
                                    {...field} 
                                  />
                                  <button
                                    type="button"
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                    onClick={() => setShowPassword(!showPassword)}
                                  >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                  </button>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="flex justify-end">
                          <Button type="button" onClick={handleNextFromStep1} className="bg-[#8C12AA] hover:bg-[#8C12AA]">Next</Button>
                        </div>
                      </div>
                    )}

                    {/* Step 2: Category Selection */}
                    {providerStep === 2 && (
                      <div className="space-y-6">
                        <FormField
                          control={form.control}
                          name="categories"
                          render={() => (
                            <FormItem className="mt-5">
                              <FormLabel>Skill Categories</FormLabel>
                              <FormControl>
                                <div>
                                  <button
                                    type="button"
                                    className="w-full flex items-center justify-between rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#8C12AA]"
                                    onClick={() => setCategoriesOpen((o) => !o)}
                                  >
                                    <span className="text-gray-600">{selectedCategories.length > 0 ? 'Edit selection' : 'Select categories'}</span>
                                    <svg className={`w-4 h-4 transition-transform ${categoriesOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd" /></svg>
                                  </button>

                                  {categoriesOpen && (
                                    <div className="mt-2 max-h-56 overflow-y-auto rounded-md border bg-white p-2 shadow-sm">
                                      {allCategories.map((category) => {
                                        const checked = selectedCategories.includes(category.slug);
                                        return (
                                          <label key={category.slug} className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 cursor-pointer">
                                            <input
                                              type="checkbox"
                                              className="h-4 w-4"
                                              checked={checked}
                                              onChange={(e) => {
                                                let next = [...selectedCategories];
                                                if (e.target.checked) {
                                                  next.push(category.slug);
                                                } else {
                                                  next = next.filter((s) => s !== category.slug);
                                                }
                                                form.setValue("categories", next, { shouldValidate: true });
                                              }}
                                            />
                                            <category.icon className="w-4 h-4 text-gray-700" />
                                            <span className="text-sm text-gray-700">{category.title}</span>
                                          </label>
                                        );
                                      })}
                                    </div>
                                  )}

                                  {/* Tags */}
                                  {selectedCategories.length > 0 && (
                                    <div className="mt-3 flex flex-wrap gap-2">
                                      {selectedCategories.map((slug) => {
                                        const cat = allCategories.find((c) => c.slug === slug);
                                        if (!cat) return null;
                                        return (
                                          <span key={slug} className="inline-flex items-center gap-1 rounded-full bg-[#8C12AA]/10 text-[#8C12AA] px-3 py-1 text-xs">
                                            {cat.title}
                                            <button
                                              type="button"
                                              className="ml-1 text-[#8C12AA] hover:text-[#6c0d83]"
                                              onClick={() => {
                                                const next = selectedCategories.filter((s) => s !== slug);
                                                form.setValue("categories", next, { shouldValidate: true });
                                              }}
                                            >
                                              Ã—
                                            </button>
                                          </span>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="flex justify-between">
                          <Button type="button" variant="outline" onClick={() => setProviderStep(1)}>Back</Button>
                          <Button type="button" onClick={handleNextFromStep2} className="bg-[#8C12AA] hover:bg-[#8C12AA]">Next</Button>
                        </div>
                      </div>
                    )}

                    {/* Step 3: Coverage Areas Multi-select with Tags */}
                    {providerStep === 3 && (
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="coverageAreas"
                          render={() => (
                            <FormItem className="mt-5">
                              <FormLabel>Coverage Areas</FormLabel>
                              <FormControl>
                                <div>
                                  <button
                                    type="button"
                                    className="w-full flex items-center justify-between rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#8C12AA]"
                                    onClick={() => setCoverageOpen((o) => !o)}
                                  >
                                    <span className="text-gray-600">{selectedAreas.length > 0 ? 'Edit selection' : 'Select coverage areas'}</span>
                                    <svg className={`w-4 h-4 transition-transform ${coverageOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd" /></svg>
                                  </button>

                                  {coverageOpen && (
                                    <div className="mt-2 max-h-48 overflow-y-auto rounded-md border bg-white p-2 shadow-sm">
                                      {nigerianStates.map((state) => {
                                        const checked = selectedAreas.includes(state);
                                        return (
                                          <label key={state} className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 cursor-pointer">
                                            <input
                                              type="checkbox"
                                              className="h-4 w-4"
                                              checked={checked}
                                              onChange={(e) => {
                                                let next = [...selectedAreas];
                                                if (e.target.checked) {
                                                  next.push(state);
                                                } else {
                                                  next = next.filter((s) => s !== state);
                                                }
                                                form.setValue("coverageAreas", next, { shouldValidate: true });
                                              }}
                                            />
                                            <span className="text-sm text-gray-700">{state}</span>
                                          </label>
                                        );
                                      })}
                                    </div>
                                  )}

                                  {/* Tags */}
                                  {selectedAreas.length > 0 && (
                                    <div className="mt-3 flex flex-wrap gap-2">
                                      {selectedAreas.map((area) => (
                                        <span key={area} className="inline-flex items-center gap-1 rounded-full bg-[#8C12AA]/10 text-[#8C12AA] px-3 py-1 text-xs">
                                          {area}
                                          <button
                                            type="button"
                                            className="ml-1 text-[#8C12AA] hover:text-[#6c0d83]"
                                            onClick={() => {
                                              const next = selectedAreas.filter((s) => s !== area);
                                              form.setValue("coverageAreas", next, { shouldValidate: true });
                                            }}
                                          >
                                            Ã—
                                          </button>
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="flex justify-between">
                          <Button type="button" variant="outline" onClick={() => setProviderStep(2)}>Back</Button>
                          <Button type="button" onClick={handleNextFromStep3} className="bg-[#8C12AA] hover:bg-[#8C12AA]">Next</Button>
                        </div>
                      </div>
                    )}

                    {/* Step 4: Short Bio */}
                    {providerStep === 4 && (
                      <div className="space-y-6">
                        <FormField
                          control={form.control}
                          name="bio"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Short Bio</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Tell us about your experience, skills, and what services you offer..."
                                  className="min-h-[120px]"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="flex justify-between">
                          <Button type="button" variant="outline" onClick={() => setProviderStep(3)}>Back</Button>
                          <Button type="submit" className="bg-[#8C12AA] hover:bg-[#8C12AA]" disabled={isLoading}>
                            {isLoading ? "Creating Account..." : "Create Account"}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </form>
            </Form>


          </CardContent>
          
          <CardFooter className="justify-center">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <Link href="/login" prefetch={false} className="text-primary hover:underline font-medium">
                Login
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
      </div>
      
      {/* Profile Completion Modal */}
      <ProfileCompletionModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onNavigateToDashboard={() => {
          setShowProfileModal(false);
          const user = supabase.auth.getUser().then(({ data }) => {
            const role = data.user?.user_metadata?.role as string | undefined;
            router.push(role === "provider" || role === "service-provider" ? "/provider" : "/dashboard");
          });
        }}
      />
    </div>
  );
}
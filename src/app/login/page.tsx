"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Eye, EyeOff } from "lucide-react";
import { SignUpHeader } from "@/components/SignUpHeader";
import { useRouter } from "next/navigation";
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
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const signInSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  remember: z.boolean().optional(),
});

type SignInFormData = z.infer<typeof signInSchema>;

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [showProfileModal, setShowProfileModal] = useState(false);
  const router = useRouter();
  
  // Check for OAuth errors in URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    const message = urlParams.get('message');
    
    if (error) {
      let errorMessage = "Authentication failed. Please try again.";
      
      switch (error) {
        case 'oauth_error':
          errorMessage = message ? decodeURIComponent(message) : "OAuth authentication failed.";
          break;
        case 'auth_error':
          errorMessage = message ? decodeURIComponent(message) : "Authentication error occurred.";
          break;
        case 'unexpected_error':
          errorMessage = "An unexpected error occurred during authentication.";
          break;
        case 'missing_code':
          errorMessage = "Authentication code missing. Please try again.";
          break;
      }
      
      setErrorMessage(errorMessage);
      
      // Clean up URL parameters
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    }
  }, []);

  // If already authenticated, redirect based on role
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

  const form = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
      remember: false,
    },
  });

  const onSubmit = async (data: SignInFormData) => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const { data: signInData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });
      if (error) {
        setErrorMessage(error.message || "Unable to sign in. Please try again.");
        return;
      }
      if (!signInData.session) {
        setErrorMessage("No active session after sign in. Please try again.");
        return;
      }
      // Successful login — route based on role
      const role = signInData.session?.user.user_metadata?.role as string | undefined;
      router.replace(
        role === "provider" || role === "service-provider" ? "/provider" : "/dashboard"
      );
    } catch (error) {
      setErrorMessage("Unexpected error while signing in. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white relative">
      <SignUpHeader />
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md animate-fade-in">
          {/* Header */}
          <div className="text-center mb-8 pt-16 animate-slide-up">
            <h1 className="text-3xl font-bold text-[#8C12AA] mb-2">Welcome back</h1>
            <p className="text-gray-600">Sign in to your account</p>
          </div>

          <Card className="border-0 shadow-xl animate-scale-in">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-[#8C12AA]">Sign In</CardTitle>
              <CardDescription>
                Enter your credentials to continue
              </CardDescription>
            </CardHeader>

            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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

                  {/* Remember + Forgot */}
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-[#8C12AA] focus:ring-[#8C12AA]"
                        checked={!!form.watch("remember")}
                        onChange={(e) => form.setValue("remember", e.target.checked)}
                      />
                      Remember me
                    </label>
                    <Link href="#" className="text-sm text-[#8C12AA] hover:text-[#8C12AA] font-medium">
                      Forgot password?
                    </Link>
                  </div>

                  {errorMessage && (
                    <div className="text-sm text-red-600">
                      {errorMessage}
                    </div>
                  )}

                  <Button type="submit" className="w-full bg-[#8C12AA] hover:bg-[#8C12AA]" disabled={isLoading}>
                    {isLoading ? "Signing in..." : "Sign In"}
                  </Button>

                </form>
              </Form>


            </CardContent>

            <CardFooter className="justify-center">
              <p className="text-sm text-gray-600">
                Don&apos;t have an account?{" "}
                <Link href="/signup" prefetch={false} className="text-primary hover:underline font-medium">
                  Sign Up
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
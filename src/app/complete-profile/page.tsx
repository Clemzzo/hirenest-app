"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { SignUpHeader } from "@/components/SignUpHeader";
import { supabase } from "@/lib/supabaseClient";
import { User } from "@supabase/supabase-js";

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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const profileSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  phone: z.string().min(7, "Please enter a valid phone number"),
  role: z.enum(["customer", "service-provider"]),
});

type ProfileFormData = z.infer<typeof profileSchema>;

function CompleteProfileContent() {
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [message, setMessage] = useState<string>("");
  const router = useRouter();
  const searchParams = useSearchParams();

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: "",
      phone: "",
      role: "customer",
    },
  });

  useEffect(() => {
    // Get the welcome message from URL params
    const urlMessage = searchParams.get('message');
    if (urlMessage) {
      setMessage(decodeURIComponent(urlMessage));
    }

    // Get current user and pre-fill form
    const getCurrentUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        // Pre-fill form with Google data if available
        const fullName = session.user.user_metadata?.full_name || 
                         session.user.user_metadata?.name || 
                         `${session.user.user_metadata?.first_name || ''} ${session.user.user_metadata?.last_name || ''}`.trim();
        
        if (fullName) {
          form.setValue('fullName', fullName);
        }
      } else {
        // No session, redirect to login
        router.push('/login');
      }
    };

    getCurrentUser();
  }, [searchParams, form, router]);

  const onSubmit = async (data: ProfileFormData) => {
    setIsLoading(true);
    try {
      if (!user) {
        throw new Error('No user session found');
      }

      // Update user metadata
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          full_name: data.fullName,
          phone_number: data.phone,
          role: data.role,
        },
      });

      if (updateError) {
        throw updateError;
      }

      // Create or update profile in database
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: data.fullName,
          phone_number: data.phone,
          role: data.role,
          email: user.email,
          updated_at: new Date().toISOString(),
        });

      if (profileError) {
        console.warn('Profile upsert error:', profileError);
        // Continue anyway as the user metadata was updated
      }

      // Redirect to appropriate dashboard
      const redirectPath = data.role === 'service-provider' ? '/provider' : '/dashboard';
      router.push(redirectPath);
    } catch (error) {
      console.error('Profile completion error:', error);
      setMessage('Failed to complete profile. Please try again.');
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
            <h1 className="text-3xl font-bold text-[#8C12AA] mb-2">Complete Your Profile</h1>
            <p className="text-gray-600">Just a few more details to get started</p>
            {message && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-green-700 text-sm">{message}</p>
              </div>
            )}
          </div>

          <Card className="border-0 shadow-xl animate-scale-in">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-[#8C12AA]">Profile Setup</CardTitle>
              <CardDescription>
                Complete your profile to access your dashboard
              </CardDescription>
            </CardHeader>

            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Full Name */}
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your full name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Phone */}
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your phone number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Role Selection */}
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>I want to:</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex flex-col space-y-2"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="customer" id="customer" />
                              <label htmlFor="customer" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Find and hire service providers
                              </label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="service-provider" id="service-provider" />
                              <label htmlFor="service-provider" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Offer my services to customers
                              </label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Submit Button */}
                  <Button 
                    type="submit" 
                    className="w-full bg-[#8C12AA] hover:bg-[#7A0E96] text-white"
                    disabled={isLoading}
                  >
                    {isLoading ? "Completing Profile..." : "Complete Profile"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function CompleteProfilePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">Loading...</div>}>
      <CompleteProfileContent />
    </Suspense>
  );
}
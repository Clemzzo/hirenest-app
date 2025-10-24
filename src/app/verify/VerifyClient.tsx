"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { SignUpHeader } from "@/components/SignUpHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { User } from "@supabase/supabase-js";
import { Mail, CheckCircle, RefreshCw, ArrowLeft, Sparkles } from "lucide-react";

export default function VerifyClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get("email") || "";

  const [confirmed, setConfirmed] = useState(false);
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [profileUpserted, setProfileUpserted] = useState(false);

  const upsertProfile = useCallback(async (user: User) => {
    if (profileUpserted || !user) return;
    try {
      setProfileUpserted(true);
      const roleMeta = String(user.user_metadata?.role || "customer");
      const payload: {
        id: string;
        full_name: string;
        role: string;
        phone_number?: string;
        bio?: string;
        categories?: string[];
        coverage_areas?: string[];
        services?: string[];
      } = {
        id: user.id,
        full_name: String(user.user_metadata?.full_name || ""),
        role: roleMeta,
      };
      if (user.user_metadata?.phone_number) {
        payload.phone_number = String(user.user_metadata.phone_number);
      }
      if (roleMeta === "service-provider" || roleMeta === "provider") {
        payload.bio = String(user.user_metadata?.bio || "");
        payload.categories = (user.user_metadata?.categories as string[]) || [];
        payload.coverage_areas = (user.user_metadata?.coverage_areas as string[]) || [];
        // Only include services if metadata provides a non-empty array to avoid wiping existing values unintentionally
        const metaServices = user.user_metadata?.services as string[] | undefined;
        if (Array.isArray(metaServices) && metaServices.length > 0) {
          payload.services = metaServices;
        }
      }
      await supabase.from("profiles").upsert(payload, { onConflict: "id" });
      // Also upsert into providers table only when services exist in metadata to avoid clearing existing services
      if (roleMeta === "service-provider" || roleMeta === "provider") {
        const metaServices = user.user_metadata?.services as string[] | undefined;
        if (Array.isArray(metaServices) && metaServices.length > 0) {
          await supabase
            .from("providers")
            .upsert({ id: user.id, services: metaServices }, { onConflict: "id" });
        }
      }
    } catch (error) {
      console.error('Error upserting profile:', error);
    }
  }, [profileUpserted]);

  // On mount, check if user is signed in and email is confirmed already
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;
      const isConfirmed = Boolean(user?.email_confirmed_at);
      if (isConfirmed && user) {
        setConfirmed(true);
        setMessage("Email verified! Redirecting to your dashboard...");
        await upsertProfile(user);
        const dest = (user?.user_metadata?.role === "provider" || user?.user_metadata?.role === "service-provider")
          ? "/provider"
          : "/dashboard";
        // Redirect after ensuring profile is upserted
        router.replace(dest);
      }
    })();

    // Listen for auth state changes after clicking email link
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user;
      const isConfirmed = Boolean(user?.email_confirmed_at);
      if (isConfirmed && user) {
        setConfirmed(true);
        setMessage("Email verified! Redirecting to your dashboard...");
        upsertProfile(user).finally(() => {
          const dest = (user?.user_metadata?.role === "provider" || user?.user_metadata?.role === "service-provider")
            ? "/provider"
            : "/dashboard";
          router.replace(dest);
        });
      }
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, [router, upsertProfile]);

  const resendVerification = async () => {
    if (!email) {
      setMessage("We couldn't detect your email. Please go back to Sign up and try again.");
      return;
    }
    try {
      setResending(true);
      setMessage("");
      const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/verify?email=${encodeURIComponent(email)}` : undefined;
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: { emailRedirectTo: redirectTo },
      });
      if (error) {
        setMessage(error.message || "Failed to resend verification email. Please try again later.");
        return;
      }
      setMessage("Verification email resent. Please check your inbox.");
    } catch (error) {
      console.error('Error resending verification:', error);
      setMessage("Something went wrong while resending. Please try again.");
    } finally {
      setResending(false);
    }
  };

  const continueToDashboard = async () => {
    try {
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Session error:', error);
        setMessage("Session error. Please try signing in again.");
        router.replace("/login");
        return;
      }
      
      const user = data.session?.user;
      
      if (!user) {
        setMessage("No active session found. Redirecting to sign in...");
        router.replace("/login");
        return;
      }
      
      // Check if email is confirmed
      if (!user.email_confirmed_at) {
        setMessage("Please verify your email first before proceeding.");
        return;
      }
      
      // Redirect based on user role
      const role = user.user_metadata?.role;
      if (role === "provider" || role === "service-provider") {
        router.replace("/provider");
      } else {
        router.replace("/dashboard");
      }
    } catch (error) {
      console.error('Error in continueToDashboard:', error);
      setMessage("An error occurred. Please try signing in again.");
      router.replace("/login");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-purple-100 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <SignUpHeader />
      
      <div className="relative z-10 max-w-2xl mx-auto px-4 py-16">
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-[#8C12AA] to-purple-600 rounded-full mb-6 shadow-lg animate-bounce-slow">
            {confirmed ? (
              <CheckCircle className="w-10 h-10 text-white" />
            ) : (
              <Mail className="w-10 h-10 text-white" />
            )}
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-[#8C12AA] to-purple-600 bg-clip-text text-transparent mb-3">
            {confirmed ? "Email Verified!" : "Check Your Email"}
          </h1>
          <p className="text-sm text-gray-600 max-w-md mx-auto leading-relaxed">
            {confirmed
              ? "Your email has been successfully verified. Welcome to HireNestly!"
              : "We've sent a verification link to your email address. Click the link to activate your account."}
          </p>
        </div>

        <Card className="border-0 shadow-2xl backdrop-blur-sm bg-white/80 animate-scale-in hover:shadow-3xl transition-all duration-300">
          <CardContent className="p-8 space-y-6">
            {!confirmed && (
              <div className="space-y-6">
                {email && (
                  <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100">
                    <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-[#8C12AA] to-purple-600 rounded-full flex items-center justify-center">
                      <Mail className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Verification sent to:</p>
                      <p className="font-semibold text-[#8C12AA] break-all">{email}</p>
                    </div>
                  </div>
                )}

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">What's next?</p>
                      <ul className="space-y-1 text-blue-700">
                         <li>• Check your email inbox (and spam folder)</li>
                         <li>• Click the verification link in the email</li>
                         <li>• Click "Proceed to Dashboard" below to go to your dashboard</li>
                       </ul>
                    </div>
                  </div>
                </div>

                {message && (
                  <div className={`p-4 rounded-xl border ${
                    message.includes('resent') || message.includes('sent') 
                      ? 'bg-green-50 border-green-200 text-green-800' 
                      : 'bg-red-50 border-red-200 text-red-800'
                  }`}>
                    <div className="flex items-center gap-2">
                      {message.includes('resent') || message.includes('sent') ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <RefreshCw className="w-5 h-5 text-red-600" />
                      )}
                      <p className="font-medium">{message}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {confirmed && (
              <div className="text-center space-y-6">
                <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-full border border-green-200">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-semibold text-green-800">{message}</span>
                </div>
                
                <div className="flex items-center justify-center gap-2 text-gray-500">
                  <div className="w-2 h-2 bg-[#8C12AA] rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-[#8C12AA] rounded-full animate-pulse animation-delay-200"></div>
                  <div className="w-2 h-2 bg-[#8C12AA] rounded-full animate-pulse animation-delay-400"></div>
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter className="p-8 pt-0">
            <div className="w-full space-y-4">
              {!confirmed && (
                <Button 
                  onClick={resendVerification} 
                  disabled={resending} 
                  className="w-full bg-gradient-to-r from-[#8C12AA] to-purple-600 hover:from-[#7a0f96] hover:to-purple-700 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
                >
                  {resending ? (
                    <div className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Resending...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4" />
                      Resend verification email
                    </div>
                  )}
                </Button>
              )}

              {confirmed && (
                <Button 
                  onClick={continueToDashboard} 
                  className="w-full bg-gradient-to-r from-[#8C12AA] to-purple-600 hover:from-[#7a0f96] hover:to-purple-700 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Continue to dashboard
                  </div>
                </Button>
              )}

              <Button 
                onClick={continueToDashboard}
                variant="ghost"
                className="flex items-center justify-center gap-2 w-full py-3 text-[#8C12AA] hover:text-purple-700 font-medium transition-colors duration-200 group hover:bg-purple-50"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-200" />
                Proceed to Dashboard
              </Button>
            </div>
          </CardFooter>
        </Card>

        {/* Additional help section */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500 mb-4">Still having trouble?</p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <Link href="/support" className="text-[#8C12AA] hover:text-purple-700 hover:underline transition-colors">
              Contact Support
            </Link>
            <span className="text-gray-300">•</span>
            <Link href="/faq" className="text-[#8C12AA] hover:text-purple-700 hover:underline transition-colors">
              FAQ
            </Link>
            <span className="text-gray-300">•</span>
            <Link href="/signup" className="text-[#8C12AA] hover:text-purple-700 hover:underline transition-colors">
              Create New Account
            </Link>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animate-bounce-slow {
          animation: bounce-slow 3s ease-in-out infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .animation-delay-200 {
          animation-delay: 200ms;
        }
        .animation-delay-400 {
          animation-delay: 400ms;
        }
        .shadow-3xl {
          box-shadow: 0 35px 60px -12px rgba(0, 0, 0, 0.25);
        }
      `}</style>
    </div>
  );
}
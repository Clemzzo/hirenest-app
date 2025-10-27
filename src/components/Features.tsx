'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, MessageCircle, Star, MapPin } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

const features = [
  {
    title: 'Verified Providers',
    description: 'All service providers are thoroughly verified with ID checks and background screening',
    icon: Shield,
    color: 'bg-[#F7E6FB] text-[#8C12AA]',
  },
  {
    title: 'In-app Chat',
    description: 'Communicate directly with service providers through our secure messaging system',
    icon: MessageCircle,
    color: 'bg-green-100 text-green-600',
  },
  {
    title: 'Ratings & Reviews',
    description: 'Transparent feedback system helps you make informed hiring decisions',
    icon: Star,
    color: 'bg-yellow-100 text-yellow-600',
  },
  {
    title: 'Local Coverage',
    description: 'Find professionals in your area with detailed location and coverage information',
    icon: MapPin,
    color: 'bg-[#F7E6FB] text-[#8C12AA]',
  },
];

const Features = () => {
  const [activeUsers, setActiveUsers] = useState<number | null>(null);
  const [providerCount, setProviderCount] = useState<number | null>(null);
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const [totalRes, providersRes] = await Promise.all([
          supabase.from('profiles').select('id', { count: 'exact' }).limit(1),
          supabase
            .from('profiles')
            .select('id', { count: 'exact' })
            .in('role', ['service-provider', 'provider'])
            .limit(1),
        ]);
        if (isMounted && !totalRes.error && typeof totalRes.count === 'number') {
          setActiveUsers(totalRes.count);
        }
        if (isMounted && !providersRes.error && typeof providersRes.count === 'number') {
          setProviderCount(providersRes.count);
        }
      } catch {
        // Silently ignore fetch aborts or transient network errors in dev
      }
    })();
    return () => { isMounted = false; };
  }, []);
  return (
    <section className="py-16 px-4 bg-white">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Why Choose Hirenest
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            We provide a secure, reliable platform that connects you with the best professionals in Nigeria
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-slide-up">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card
                key={feature.title}
                className="text-center hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              >
                <CardHeader>
                  <div className={`w-16 h-16 rounded-full ${feature.color} flex items-center justify-center mx-auto mb-4`}>
                    <Icon className="w-8 h-8" />
                  </div>
                  <CardTitle className="text-xl font-semibold text-gray-900">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center mt-12 animate-fade-in">
          <div className="bg-gradient-to-r from-[#FAF0FD] to-[#F3E3F8] rounded-2xl p-8 max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Trusted by Thousands
            </h3>
            <p className="text-gray-600 mb-6">
              Join our growing community of satisfied customers and professional service providers across Nigeria
            </p>
            <div className="grid grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-3xl font-bold text-[#8C12AA] mb-2">{activeUsers !== null ? activeUsers.toLocaleString() : "—"}</div>
                <div className="text-sm text-gray-600">Active Users</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-green-600 mb-2">{providerCount !== null ? providerCount.toLocaleString() : "—"}</div>
                <div className="text-sm text-gray-600">Service Providers</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-yellow-600 mb-2">50+</div>
                <div className="text-sm text-gray-600">Cities Covered</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus, Search, Star } from 'lucide-react';

const steps = [
  {
    title: 'Sign Up',
    description: 'Create your account as a customer or service provider in minutes',
    icon: UserPlus,
    color: 'bg-[#F7E6FB] text-[#8C12AA]',
  },
  {
    title: 'Hire/Offer Services',
    description: 'Browse and hire professionals or showcase your skills to potential clients',
    icon: Search,
    color: 'bg-green-100 text-green-600',
  },
  {
    title: 'Work & Review',
    description: 'Complete projects and leave reviews to build trust in the community',
    icon: Star,
    color: 'bg-[#F7E6FB] text-[#8C12AA]',
  },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-16 px-4 bg-gray-50">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            How It Works
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Get started with HireNestly in just three simple steps
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-slide-up">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={step.title} className="relative">
                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-16 left-full w-full h-0.5 bg-gray-200 -translate-x-1/2">
                    <div className="absolute right-0 top-1/2 w-2 h-2 bg-[#8C12AA] rounded-full transform -translate-y-1/2"></div>
                  </div>
                )}
                
                <Card className="text-center hover:shadow-lg transition-shadow duration-300 h-full">
                  <CardHeader>
                    <div className="flex items-center justify-center mb-4">
                      <div className={`w-16 h-16 rounded-full ${step.color} flex items-center justify-center`}>
                        <Icon className="w-8 h-8" />
                      </div>
                    </div>
                    <div className="flex items-center justify-center mb-2">
                      <span className="inline-flex items-center justify-center w-8 h-8 bg-[#8C12AA] text-white text-sm font-bold rounded-full">
                        {index + 1}
                      </span>
                    </div>
                    <CardTitle className="text-xl font-semibold text-gray-900">
                      {step.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-gray-600">
                      {step.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>

        <div className="text-center mt-12 animate-fade-in">
          <p className="text-gray-600 mb-6">
            Ready to get started? Join thousands of satisfied users today!
          </p>
          <button className="bg-[#8C12AA] hover:bg-[#8C12AA] text-white px-8 py-3 rounded-lg font-medium transition-colors">
            Get Started Now
          </button>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
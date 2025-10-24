'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function About() {
  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-16 pt-28">
        <h1 className="text-4xl font-bold text-center text-[#8C12AA] mb-12">About Hirenest</h1>
        
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Project Overview</h2>
          <p className="text-gray-700">
            Hirenest is a Marketplace Web Application that connects Customers with Service Providers across Nigeria. 
            Customers will be able to hire vetted individuals with diverse skill sets (e.g., Developers, Designers, 
            Photographers, Caterers, etc.), while Service Providers can showcase their expertise, define service 
            coverage areas, and interact with customers.
          </p>
          <p className="text-gray-700 mt-4">
            The platform offers onboarding flows, dashboards, in-app chat, reviews, and an Admin backend for 
            monitoring activities and dispute resolution.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Goals & Objectives</h2>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>Provide an easy-to-use marketplace where customers can find and hire skilled professionals.</li>
            <li>Enable Service Providers to register, verify their identity, and advertise their skills.</li>
            <li>Offer real-time communication between customers and providers via in-app chat.</li>
            <li>Implement trust mechanisms (reviews, ratings, admin oversight, ID verification).</li>
            <li>Launch scalable MVP that can be extended with payment gateway, bookings, and additional features later.</li>
          </ul>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Target Users</h2>
          <h3 className="text-xl font-medium mb-2">Primary Users:</h3>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li><strong>Customers:</strong> Individuals or businesses seeking professional services. Ability to browse, filter, hire, and review service providers.</li>
            <li><strong>Service Providers:</strong> Skilled professionals registering under specific categories. Ability to create service profiles, define coverage area, and interact with customers.</li>
          </ul>
          <h3 className="text-xl font-medium mt-4 mb-2">Secondary Users:</h3>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li><strong>Administrators:</strong> Oversee platform operations. Handle disputes, verify identities, manage reports, and ensure compliance.</li>
          </ul>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Key Features</h2>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>User Authentication & Onboarding</li>
            <li>Dashboards for Customers, Service Providers, and Admins</li>
            <li>Service Provider Profiles</li>
            <li>Search & Hire Flow</li>
            <li>In-App Chat System</li>
            <li>Ratings & Reviews</li>
          </ul>
        </section>

        <section className="text-center">
          <h2 className="text-2xl font-semibold mb-4">Join Hirenest Today</h2>
          <p className="text-gray-700 mb-6">Connect with skilled professionals or offer your services across Nigeria.</p>
          <Button asChild className="bg-[#8C12AA] hover:bg-[#8C12AA]/90">
            <Link href="/signup">Get Started</Link>
          </Button>
        </section>
      </div>
      <Footer />
    </main>
  );
}
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useEffect, useRef, useState } from 'react';
import heroImage from '../../assets/heroimage.png';

const Hero = () => {
  // Typing effect for the word "professionals"
  const [typed, setTyped] = useState('');
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const full = 'professionals';
    let i = 0;
    let isDeleting = false;
    let pauseTicks = 0; // brief pause at start/end of each cycle

    const id = setInterval(() => {
      if (pauseTicks > 0) {
        pauseTicks -= 1;
        return;
      }

      if (!isDeleting) {
        i += 1;
        setTyped(full.slice(0, i));
        if (i >= full.length) {
          isDeleting = true;
          pauseTicks = 10; // pause when fully typed
        }
      } else {
        i -= 1;
        setTyped(full.slice(0, Math.max(i, 0)));
        if (i <= 0) {
          isDeleting = false;
          pauseTicks = 8; // pause when cleared
        }
      }
    }, 80);

    return () => clearInterval(id);
  }, []);

  return (
    <section className="relative overflow-hidden bg-gradient-to-tr from-white via-[#FFFFFF] to-[#AD15B0]">
      <div className="relative container mx-auto max-w-6xl px-4 pt-28 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Left: Text & CTAs */}
          <div className="order-2 lg:order-1">
            <h1 className="text-4xl md:text-6xl font-bold text-[#6E0FB1] leading-tight">
              <span className="block">Find trusted</span>
              <span className="block">
                <span className="capitalize">{typed}</span>
                <span>{' '}—</span>
              </span>
              <span className="block text-[#AD15B0]">Quickly...</span>
            </h1>
            <p className="mt-6 text-lg md:text-xl text-gray-700 max-w-xl leading-relaxed">
              Hire verified developers, designers, creatives, and service providers across Nigeria.
            </p>

            {/* CTA Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row gap-8">
              <Link href="/signup" prefetch={false}>
                <Button
                  size="lg"
                  className="bg-[#AD15B0] hover:bg-[#8C12AA] text-white px-8 py-3 text-lg rounded-md shadow-[0_8px_24px_rgba(140,18,170,0.25)]"
                >
                  Get Started (Customers)
                </Button>
              </Link>
              <Link href="/signup" prefetch={false}>
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-md border-[#8C12AA] text-[#8C12AA] hover:bg-[#F7E6FB] px-8 py-3 text-lg shadow-[0_8px_24px_rgba(17,17,17,0.08)] bg-white"
                >
                  Join as Provider
                </Button>
              </Link>
            </div>
          </div>

          {/* Right: Hero Image */}
          <div className="order-1 lg:order-2 justify-self-center">
            <div className="relative w-[520px] max-w-full">
              <div className="relative rounded-[32px] overflow-hidden">
                <Image
                  src={heroImage}
                  alt="Professionals collage"
                  priority
                  className="w-full h-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;

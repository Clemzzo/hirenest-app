'use client';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Star, Quote } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import AutoScroll from "embla-carousel-auto-scroll";

const testimonials = [
  {
    id: 1,
    name: "Chiamaka Okafor",
    role: "Small Business Owner",
    location: "Lagos",
    content: "HireNestly helped me find a reliable web developer for my online store. The process was smooth and the developer was professional and affordable.",
    rating: 5,
    avatar: "CO"
  },
  {
    id: 2,
    name: "Ahmed Bello",
    role: "Event Planner",
    location: "Abuja",
    content: "I needed a photographer for a corporate event and got connected with someone perfect within hours. Great platform for finding local talent!",
    rating: 5,
    avatar: "AB"
  },
  {
    id: 3,
    name: "Grace Adeyemi",
    role: "Homeowner",
    location: "Ibadan",
    content: "Found an excellent electrician who fixed all the wiring issues in my house. The verification system gave me confidence in hiring.",
    rating: 4,
    avatar: "GA"
  },
  {
    id: 4,
    name: "Tunde Johnson",
    role: "Startup Founder",
    location: "Lagos",
    content: "As a startup, we needed affordable design services. HireNestly connected us with talented designers who understood our budget constraints.",
    rating: 5,
    avatar: "TJ"
  }
];

export default function Testimonials() {
  return (
    <section className="py-20 bg-gradient-to-b from-white to-gray-50">
      <div className="container-max section-padding">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            What Our Users Say
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Join thousands of satisfied customers who have found reliable service providers through HireNestly
          </p>
        </div>

        <Carousel
          opts={{ align: "start", loop: true }}
          plugins={[
            AutoScroll({
              speed: 1,
              stopOnMouseEnter: true,
              stopOnInteraction: false,
            }),
          ]}
          className="w-full"
        >
          <CarouselContent className="-ml-1">
            {testimonials.map((testimonial, index) => (
              <CarouselItem
                key={testimonial.id}
                className="pl-1 md:basis-1/2 lg:basis-1/3"
              >
                <Card 
                  className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 animate-slide-up animate-performance"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-semibold">
                        {testimonial.avatar}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{testimonial.name}</h3>
                        <p className="text-sm text-gray-500">{testimonial.role} • {testimonial.location}</p>
                      </div>
                      <Quote className="w-6 h-6 text-primary opacity-20" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex mb-3">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < testimonial.rating
                              ? "text-yellow-400 fill-current"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-gray-700 leading-relaxed">{testimonial.content}</p>
                  </CardContent>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>

        <div className="text-center mt-16 animate-fade-in animate-delay-200">
          <div className="inline-flex items-center gap-8 text-gray-600">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">10,000+</div>
              <div className="text-sm">Happy Customers</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">95%</div>
              <div className="text-sm">Satisfaction Rate</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">4.8/5</div>
              <div className="text-sm">Average Rating</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
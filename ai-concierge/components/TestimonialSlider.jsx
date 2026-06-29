"use client";

import React, { useRef, useState, useEffect } from "react";
import Image from "next/image";
import { Star, CheckCircle2 } from "lucide-react";

const testimonials = [
  {
    id: 1,
    name: "Sarah Jenkins",
    role: "Verified Buyer",
    text: "The AI concierge actually analyzed my skin type and recommended the perfect bundle. My skin has never looked more radiant. I'm literally glowing!",
    image: "/images/testimonials/1.jpg", // Placeholder for user's image
  },
  {
    id: 2,
    name: "Emily Chen",
    role: "Skincare Enthusiast",
    text: "I was skeptical about the botanical formulations, but the cleanser is incredibly gentle yet effective. The customer service via the AI is next level.",
    image: "/images/testimonials/2.jpg",
  },
  {
    id: 3,
    name: "Jessica Rivera",
    role: "Verified Buyer",
    text: "Finally found a sunscreen that doesn't leave a white cast or break me out! The whole Luminara line feels so premium and luxurious.",
    image: "/images/testimonials/3.jpg",
  },
  {
    id: 4,
    name: "Amanda Brooks",
    role: "Verified Buyer",
    text: "I love that everything is ethically sourced. The moisturizer is thick but absorbs instantly. Highly recommend chatting with the AI to find your match.",
    image: "/images/testimonials/4.jpg",
  }
];

export default function TestimonialSlider() {
  const scrollRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    let animationFrameId;

    const scroll = () => {
      if (scrollRef.current && !isHovered) {
        scrollRef.current.scrollLeft += 1; // Auto-scroll speed (slightly slower for text reading)
        
        // Reset seamlessly back to 0 when we reach half the width
        if (
          scrollRef.current.scrollLeft >=
          scrollRef.current.scrollWidth / 2
        ) {
          scrollRef.current.scrollLeft = 0;
        }
      }
      animationFrameId = requestAnimationFrame(scroll);
    };

    animationFrameId = requestAnimationFrame(scroll);

    return () => cancelAnimationFrame(animationFrameId);
  }, [isHovered]);

  // Duplicate the array to ensure enough content for seamless infinite scroll
  const duplicatedTestimonials = [...testimonials, ...testimonials, ...testimonials];

  return (
    <section className="py-24 px-0 bg-white overflow-hidden border-t border-stone-200/50">
      <div className="text-center max-w-2xl mx-auto space-y-4 mb-16 px-6">
        <span className="text-xs font-semibold tracking-widest uppercase text-stone-400">Real Results</span>
        <h2 className="text-3xl md:text-5xl font-serif font-bold text-stone-950">What Our Community Says</h2>
        <div className="w-12 h-1 bg-primary mx-auto rounded-full"></div>
      </div>

      <div 
        className="relative w-full pb-8"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onTouchStart={() => setIsHovered(true)}
        onTouchEnd={() => setIsHovered(false)}
      >
        {/* Left/Right fade gradients for a smooth visual edge */}
        <div className="absolute left-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none"></div>
        <div className="absolute right-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none"></div>

        <div
          ref={scrollRef}
          className="flex gap-6 px-6 md:gap-8 md:px-8 overflow-x-auto no-scrollbar scroll-smooth cursor-grab active:cursor-grabbing"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {duplicatedTestimonials.map((testimonial, index) => (
            <div 
              key={`${testimonial.id}-${index}`} 
              className="flex-none w-80 md:w-[400px] bg-stone-50 border border-stone-200/60 rounded-3xl p-8 hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="w-4 h-4 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-stone-700 italic leading-relaxed text-sm md:text-base">
                  &quot;{testimonial.text}&quot;
                </p>
              </div>
              
              <div className="flex items-center gap-4 mt-8 pt-6 border-t border-stone-200/50">
                <div className="relative w-12 h-12 rounded-full overflow-hidden bg-stone-200 shrink-0">
                  <Image
                    src={testimonial.image}
                    alt={testimonial.name}
                    fill
                    className="object-cover"
                    // If image fails to load, it will fallback to the grey background
                  />
                </div>
                <div>
                  <h4 className="font-bold text-stone-900 text-sm">{testimonial.name}</h4>
                  <div className="flex items-center gap-1.5 text-xs text-stone-500 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{testimonial.role}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

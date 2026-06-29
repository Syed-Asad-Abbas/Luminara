"use client";

import React, { useRef, useState, useEffect } from "react";
import ProductCard from "./ProductCard";

export default function ProductSlider({ catalog, onAddToCart, onBuyNow }) {
  const scrollRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);

  // If catalog is empty, render skeletons
  if (!catalog || catalog.length === 0) {
    return (
      <div className="flex gap-8 overflow-hidden py-4 px-4 max-w-7xl mx-auto">
        {[1, 2, 3, 4].map((n) => (
          <div
            key={n}
            className="flex-none w-72 md:w-80 bg-stone-100 animate-pulse rounded-2xl aspect-[4/5]"
          />
        ))}
      </div>
    );
  }



  return (
    <div 
      className="relative w-full py-8"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={() => setIsHovered(true)}
      onTouchEnd={() => setIsHovered(false)}
    >
      {/* Left/Right fade gradients for a smooth visual edge */}
      <div className="absolute left-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-r from-stone-50/50 to-transparent z-10 pointer-events-none"></div>
      <div className="absolute right-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-l from-stone-50/50 to-transparent z-10 pointer-events-none"></div>

      <div
        ref={scrollRef}
        className="flex gap-6 px-6 md:gap-8 md:px-8 overflow-x-auto no-scrollbar scroll-smooth cursor-grab active:cursor-grabbing"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {catalog.map((product, index) => (
          <div key={`${product._id}-${index}`} className="flex-none w-72 md:w-80">
            <ProductCard product={product} onAddToCart={onAddToCart} onBuyNow={onBuyNow} />
          </div>
        ))}
      </div>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}

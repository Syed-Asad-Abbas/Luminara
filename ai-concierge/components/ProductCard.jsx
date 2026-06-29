"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Plus, Check, ShoppingBag } from "lucide-react";

// Helper to render beautiful placeholder SVGs based on product category
const ProductImagePlaceholder = ({ category }) => {
  let gradientColors = "from-orange-200 to-amber-100";
  if (category === "cleanser") gradientColors = "from-teal-200 to-emerald-100";
  if (category === "moisturizer") gradientColors = "from-rose-200 to-pink-100";
  if (category === "bundle") gradientColors = "from-indigo-200 to-violet-100";
  if (category === "toner") gradientColors = "from-sky-200 to-blue-100";

  return (
    <div className={`w-full h-full bg-gradient-to-tr ${gradientColors} flex items-center justify-center`}>
      <ShoppingBag className="w-6 h-6 text-stone-600/30" />
    </div>
  );
};

export default function ProductCard({ product, onAddToCart, onBuyNow, isMini = false }) {
  const [isAdding, setIsAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleAdd = async (e) => {
    e.stopPropagation();
    setIsAdding(true);
    await onAddToCart(product._id);
    setIsAdding(false);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const renderProductImage = (sizesVal) => {
    if (product.image_url && !imageError) {
      return (
        <Image
          src={product.image_url}
          alt={product.title}
          fill
          sizes={sizesVal}
          onError={() => setImageError(true)}
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      );
    }
    return <ProductImagePlaceholder category={product.category} />;
  };

  if (isMini) {
    // Landscape style card designed to fit perfectly inside the narrow chat column
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center gap-3 p-3 bg-white/80 rounded-xl border border-stone-200/60 shadow-sm hover:shadow-md transition-shadow group overflow-hidden"
      >
        <Link href={`/products/${product._id}`} className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border border-stone-100 relative block cursor-pointer">
          {renderProductImage("64px")}
        </Link>

        <div className="flex-1 min-w-0">
          <Link href={`/products/${product._id}`} className="cursor-pointer">
            <h4 className="text-sm font-semibold text-stone-900 truncate leading-tight hover:text-primary transition-colors">
              {product.title}
            </h4>
          </Link>
          <p className="text-xs text-stone-500 line-clamp-1 mt-0.5">
            {product.description}
          </p>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-sm font-medium text-stone-900">${product.price.toFixed(2)}</span>
            <button
              onClick={handleAdd}
              disabled={isAdding}
              className={`flex items-center gap-1 py-1 px-2.5 rounded-full text-xs font-semibold tracking-wide transition-all ${
                added
                  ? "bg-emerald-600 text-white"
                  : "bg-primary text-white hover:bg-stone-800"
              }`}
            >
              {added ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Added</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  // Full-size grid card for the store front landing page
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="bg-white rounded-2xl border border-stone-200/50 shadow-sm overflow-hidden flex flex-col h-full hover:shadow-xl transition-all duration-300 group"
    >
      <Link href={`/products/${product._id}`} className="w-full aspect-[4/3] relative overflow-hidden border-b border-stone-100 block cursor-pointer">
        {renderProductImage("(max-width: 768px) 100vw, 33vw")}
      </Link>

      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <span className="text-xs font-semibold tracking-widest uppercase text-stone-400">
            {product.category}
          </span>
          <Link href={`/products/${product._id}`} className="cursor-pointer">
            <h3 className="text-lg font-bold font-serif text-stone-950 mt-1 leading-snug hover:text-primary transition-colors">
              {product.title}
            </h3>
          </Link>
          <p className="text-stone-600 text-sm mt-2 line-clamp-3 leading-relaxed">
            {product.description}
          </p>
        </div>

        <div className="flex items-center justify-between mt-5 pt-4 border-t border-stone-100">
          <span className="text-xl font-bold text-stone-900">
            ${product.price.toFixed(2)}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

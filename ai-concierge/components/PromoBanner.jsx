"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

export default function PromoBanner() {
  const [isVisible, setIsVisible] = useState(true);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          className="bg-primary text-white overflow-hidden relative z-50"
        >
          <div className="flex items-center justify-center px-4 py-2.5 max-w-7xl mx-auto">
            <p className="text-sm font-medium tracking-wide">
              Free shipping on orders over $50
            </p>
            <button
              onClick={() => setIsVisible(false)}
              className="absolute right-4 p-1 rounded-full hover:bg-white/20 transition-colors focus:outline-none"
              aria-label="Close banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

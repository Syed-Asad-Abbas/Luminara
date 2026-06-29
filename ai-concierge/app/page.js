"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, X, Star, Sparkles, Check, ArrowRight } from "lucide-react";
import ProductCard from "../components/ProductCard";
import ChatWidget from "../components/ChatWidget";
import PromoBanner from "../components/PromoBanner";
import ProductSlider from "../components/ProductSlider";
import TestimonialSlider from "../components/TestimonialSlider";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function Home() {
  const [catalog, setCatalog] = useState([]);
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [isCheckoutSuccess, setIsCheckoutSuccess] = useState(false);
  const [checkoutEmail, setCheckoutEmail] = useState("");
  const [checkoutName, setCheckoutName] = useState("");
  const [checkoutAddress, setCheckoutAddress] = useState("");
  const [checkoutCard, setCheckoutCard] = useState("");
  const [checkoutExpiry, setCheckoutExpiry] = useState("");
  const [checkoutCvc, setCheckoutCvc] = useState("");
  const [orderNumber, setOrderNumber] = useState("");

  // Initialize Session & Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      let sId = localStorage.getItem("luminara_session_id");
      if (!sId) {
        sId = "session_" + Math.random().toString(36).substring(2, 15);
        localStorage.setItem("luminara_session_id", sId);
      }
      setSessionId(sId);

      try {
        // Fetch product catalog
        const prodRes = await fetch(`${API_URL}/api/products`);
        const prodData = await prodRes.json();
        setCatalog(prodData.products || []);

        // Fetch current user cart
        const cartRes = await fetch(`${API_URL}/api/cart`, {
          headers: { "x-session-id": sId },
        });
        const cartData = await cartRes.json();
        setCart(cartData.cart || []);
      } catch (err) {
        console.error("Error loading storefront data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Update Cart handler
  const handleAddToCart = async (productId) => {
    try {
      const res = await fetch(`${API_URL}/api/cart`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-session-id": sessionId,
        },
        body: JSON.stringify({ productId, quantity: 1 }),
      });
      const data = await res.json();
      if (data.success) {
        setCart(data.cart);
      }
    } catch (err) {
      console.error("Error adding to cart:", err);
    }
  };

  const handleBuyNow = async (productId) => {
    await handleAddToCart(productId);
    setIsCheckoutOpen(true);
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  };

  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-stone-50/50 flex flex-col selection:bg-primary/10">
      <PromoBanner />
      {/* Header / Navbar */}
      <header className="sticky top-0 z-40 bg-white/70 backdrop-blur-md border-b border-stone-200/50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <span className="font-serif font-black tracking-widest text-xl text-stone-900">L U M I N A R A</span>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-xs font-semibold uppercase tracking-widest text-stone-600">
          <a href="#collection" className="hover:text-primary transition-colors">The Collection</a>
          <a href="#philosophy" className="hover:text-primary transition-colors">Skincare Philosophy</a>
          <a href="#science" className="hover:text-primary transition-colors">Science & Formulations</a>
        </nav>

        <div className="flex items-center gap-4">
          {/* Cart Icon Toggle */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="flex items-center gap-2 p-2 bg-stone-100/80 hover:bg-stone-200/60 text-stone-900 rounded-full transition-all relative"
          >
            <ShoppingBag className="w-5 h-5" />
            {totalItemsCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-primary text-white font-bold text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                {totalItemsCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* Luxury Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-stone-100 via-orange-50/20 to-stone-50 py-24 px-6 md:px-12 lg:px-24">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full text-primary text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Next-Generation Skincare Assistant</span>
              </div>
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif font-bold text-stone-950 leading-tight">
                Intelligent Skincare. <br />
                <span className="text-primary italic font-normal">Radiance Redefined.</span>
              </h1>
              <p className="text-stone-600 text-base md:text-lg max-w-xl leading-relaxed">
                Experience dermatologist-tested, organic, and ethically sourced formulations designed for your skin&apos;s natural brilliance. Talk to our **AI Concierge** below for a personalized skincare analysis and direct purchase flows.
              </p>
              <div className="flex items-center gap-4 pt-4">
                <a
                  href="#collection"
                  className="px-6 py-3 rounded-full bg-primary text-white text-sm font-semibold hover:bg-stone-800 transition-all flex items-center gap-2"
                >
                  <span>Explore the Collection</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Dynamic Product Showcase Mock */}
            <div className="lg:col-span-5 relative flex justify-center">
              <div className="w-80 h-96 relative bg-gradient-to-tr from-stone-200 to-amber-100 rounded-3xl overflow-hidden shadow-2xl flex items-center justify-center border border-white/20">
                <div className="absolute inset-0 bg-black/10 mix-blend-overlay"></div>
                <div className="z-10 text-center p-6 text-stone-900 space-y-4">
                  <Star className="w-8 h-8 text-amber-500 fill-amber-500 mx-auto" />
                  <h3 className="font-serif text-2xl font-bold">Luminara Glow</h3>
                  <p className="text-xs text-stone-700 max-w-[200px] mx-auto">
                    Try our vector-driven search in the chatbot to fetch personalized products matching your skin conditions.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Collection Section */}
        <section id="collection" className="py-24 px-6 md:px-12 lg:px-24 max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto space-y-4 mb-16">
            <span className="text-xs font-semibold tracking-widest uppercase text-stone-400">Curated Formulas</span>
            <h2 className="text-3xl md:text-5xl font-serif font-bold text-stone-950">Our Signature Products</h2>
            <div className="w-12 h-1 bg-primary mx-auto rounded-full"></div>
            <p className="text-stone-600 text-sm md:text-base">
              Meticulously crafted for maximum efficacy and gentleness. Try asking our AI assistant in the bottom-right corner to explain which product fits your specific routine.
            </p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((n) => (
                <div key={n} className="bg-stone-100 animate-pulse rounded-2xl aspect-[4/5]" />
              ))}
            </div>
          ) : (
            <ProductSlider catalog={catalog} onAddToCart={handleAddToCart} onBuyNow={handleBuyNow} />
          )}
        </section>

        {/* Philosophy Section */}
        <section id="philosophy" className="py-24 px-6 md:px-12 lg:px-24 bg-stone-100/40 border-y border-stone-200/50">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 space-y-6">
              <span className="text-xs font-semibold tracking-widest uppercase text-stone-400">Our Core Belief</span>
              <h2 className="text-3xl md:text-5xl font-serif font-bold text-stone-950 leading-tight">
                Designed by Nature. <br />
                <span className="text-primary italic font-normal">Validated by Science.</span>
              </h2>
              <p className="text-stone-600 text-sm md:text-base leading-relaxed">
                At Luminara, we believe skincare should be an act of nourishing self-care, not a chemical battle. We source premium botanical ingredients that work in perfect harmony with your body&apos;s natural renewal processes, and back them with rigorous clinical validation.
              </p>
              <p className="text-stone-600 text-sm md:text-base leading-relaxed">
                Our formulas are clean, vegan, hypoallergenic, and optimized to respect the delicate barrier of sensitive skin.
              </p>
            </div>
            
            <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[
                { title: "Pure Botanicals", desc: "100% organic, cold-pressed plant extracts and floral distillates." },
                { title: "Clinical Integrity", desc: "Every formula undergoes intensive testing for efficacy and safety." },
                { title: "Eco-Conscious Packaging", desc: "Recyclable amber glass preserves formula potency without plastic waste." },
                { title: "Zero Harm", desc: "Completely free from synthetic fragrances, parabens, and cruelty-free." }
              ].map((item, idx) => (
                <div key={idx} className="p-6 bg-white rounded-2xl border border-stone-200/20 shadow-sm space-y-2 hover:shadow-md transition-shadow">
                  <h3 className="font-serif font-bold text-stone-900 text-base">{item.title}</h3>
                  <p className="text-xs text-stone-500 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Slider Section */}
        <TestimonialSlider />

        {/* Science Section */}
        <section id="science" className="py-24 px-6 md:px-12 lg:px-24 max-w-7xl mx-auto space-y-16">
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <span className="text-xs font-semibold tracking-widest uppercase text-stone-400">Formula Science</span>
            <h2 className="text-3xl md:text-5xl font-serif font-bold text-stone-950">Active Skincare Ingredients</h2>
            <div className="w-12 h-1 bg-primary mx-auto rounded-full"></div>
            <p className="text-stone-600 text-sm md:text-base">
              We leverage clean, clinical-grade active ingredients at concentration levels proven to heal, protect, and illuminate.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { name: "Niacinamide (Vitamin B3)", use: "Barrier Repair & Calming", benefit: "Reduces visual redness, minimizes appearance of pores, and strengthens the skin’s lipid barrier against external stressors." },
              { name: "Colloidal Oatmeal", use: "Soothing & Relief", benefit: "Provides dynamic relief for dry, itchy, or sensitive skin conditions, leaving a comforting shield of hydration." },
              { name: "Hyaluronic Acid", use: "Deep Cellular Hydration", benefit: "Draws moisture deep into the epidermal layers, plumping skin structure and filling fine dehydration lines." }
            ].map((ingredient, i) => (
              <div key={i} className="p-8 bg-white border border-stone-200/50 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-between">
                <div className="space-y-4">
                  <span className="text-xs font-bold text-primary uppercase tracking-wider bg-primary/10 px-2.5 py-1 rounded-full">{ingredient.use}</span>
                  <h3 className="text-xl font-serif font-bold text-stone-950 pt-2">{ingredient.name}</h3>
                  <p className="text-stone-600 text-sm leading-relaxed">{ingredient.benefit}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-gradient-to-tr from-stone-900 to-stone-950 text-white rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 border border-white/5">
            <div className="space-y-3 max-w-xl text-center md:text-left">
              <h3 className="text-2xl md:text-3xl font-serif font-bold text-amber-100">Confused about your skin routine?</h3>
              <p className="text-stone-400 text-xs md:text-sm leading-relaxed">
                Skincare isn&apos;t one-size-fits-all. Tell our AI Concierge about your skin type, concerns, and goals, and it will construct a routine for you instantly.
              </p>
            </div>
            <button
              onClick={() => {
                // Focus or open chat widget
                const trigger = document.querySelector('button[class*="fixed bottom-6 right-6"]');
                if (trigger) trigger.click();
              }}
              className="px-6 py-3 rounded-full bg-white text-stone-950 hover:bg-amber-100 text-xs md:text-sm font-bold tracking-wider uppercase transition-colors shrink-0"
            >
              Consult AI Assistant
            </button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-stone-900 text-stone-400 py-12 px-6 md:px-12 border-t border-stone-800 mt-24">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <span className="font-serif font-black tracking-widest text-lg text-white">L U M I N A R A</span>
            <p className="text-xs mt-1 text-stone-500">© 2026 Luminara Inc. All rights reserved.</p>
          </div>
          <div className="flex gap-6 text-xs uppercase tracking-wider">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Shipping</a>
          </div>
        </div>
      </footer>

      {/* Cart Drawer Panel */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-black z-50"
            />
            {/* Sidebar panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white z-50 shadow-2xl flex flex-col border-l border-stone-100"
            >
              <div className="p-5 border-b border-stone-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-stone-900" />
                  <h3 className="font-serif font-bold text-lg text-stone-900">Your Cart</h3>
                  <span className="text-xs bg-stone-100 py-0.5 px-2 rounded-full text-stone-600">
                    {totalItemsCount}
                  </span>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="w-8 h-8 rounded-full hover:bg-stone-100 flex items-center justify-center transition-colors"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Items List */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                    <ShoppingBag className="w-12 h-12 text-stone-300" />
                    <h4 className="font-serif font-bold text-stone-900">Your cart is empty</h4>
                    <p className="text-xs text-stone-500 max-w-[200px]">
                      Discover products on our collection or ask our AI Concierge for recommendations.
                    </p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div key={item.product._id} className="flex gap-4 p-3 bg-stone-50 rounded-xl border border-stone-200/40">
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-stone-200 flex-shrink-0 flex items-center justify-center">
                        <ShoppingBag className="w-5 h-5 text-stone-400" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-bold text-stone-950 truncate leading-snug">{item.product.title}</h4>
                        <span className="text-xs text-stone-500">Qty: {item.quantity}</span>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-sm font-semibold text-stone-900">${(item.product.price * item.quantity).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Drawer Footer / Checkout */}
              {cart.length > 0 && (
                <div className="p-5 border-t border-stone-100 bg-stone-50/50 space-y-4">
                  <div className="flex items-center justify-between text-base font-medium text-stone-950">
                    <span>Subtotal</span>
                    <span className="font-bold font-serif text-lg">${calculateTotal().toFixed(2)}</span>
                  </div>
                  <button
                    onClick={() => {
                      setIsCartOpen(false);
                      setIsCheckoutOpen(true);
                    }}
                    className="w-full py-3 rounded-full bg-primary hover:bg-stone-850 text-white text-sm font-semibold tracking-wide transition-colors"
                  >
                    Proceed to Checkout
                  </button>
                  <p className="text-[10px] text-center text-stone-400">
                    Taxes and shipping calculated at checkout. Powered by Luminara Concierge.
                  </p>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Checkout Modal Panel */}
      <AnimatePresence>
        {isCheckoutOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (!isCheckoutLoading && !isCheckoutSuccess) setIsCheckoutOpen(false);
              }}
              className="fixed inset-0 bg-black z-50 backdrop-blur-sm"
            />
            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-x-4 top-10 bottom-10 md:inset-auto md:top-[10%] md:left-[50%] md:translate-x-[-50%] md:w-[600px] bg-white rounded-3xl z-50 shadow-2xl flex flex-col overflow-hidden border border-stone-200/50"
            >
              {isCheckoutSuccess ? (
                // Success screen
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6 bg-gradient-to-tr from-amber-50/30 to-stone-50/50">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                    <Check className="w-8 h-8 stroke-[3]" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-serif font-bold text-2xl text-stone-900">Purchase Completed!</h3>
                    <p className="text-xs text-stone-500">Your order has been received and processed successfully.</p>
                  </div>
                  <div className="bg-stone-100/50 border border-stone-200/50 px-6 py-4 rounded-2xl w-full max-w-sm space-y-1">
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Order Identifier</span>
                    <p className="font-mono font-bold text-base text-stone-850">{orderNumber}</p>
                    <p className="text-[10px] text-stone-400">A confirmation receipt has been sent to your email.</p>
                  </div>
                  <button
                    onClick={() => {
                      setIsCheckoutOpen(false);
                      setIsCheckoutSuccess(false);
                      setCheckoutEmail("");
                      setCheckoutName("");
                      setCheckoutAddress("");
                      setCheckoutCard("");
                      setCheckoutExpiry("");
                      setCheckoutCvc("");
                    }}
                    className="px-8 py-3 rounded-full bg-primary hover:bg-stone-850 text-white font-semibold text-xs tracking-wider uppercase transition-colors"
                  >
                    Continue Shopping
                  </button>
                </div>
              ) : (
                // Checkout Forms
                <>
                  <div className="p-6 border-b border-stone-100 flex items-center justify-between">
                    <h3 className="font-serif font-bold text-lg text-stone-900">Checkout</h3>
                    <button
                      onClick={() => setIsCheckoutOpen(false)}
                      disabled={isCheckoutLoading}
                      className="w-8 h-8 rounded-full hover:bg-stone-100 flex items-center justify-center transition-colors"
                    >
                      <X className="w-4.5 h-4.5" />
                    </button>
                  </div>

                  <form 
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const API_URL = "http://localhost:5000";
                      setIsCheckoutLoading(true);
                      // Clear cart on backend
                      try {
                        await fetch(`${API_URL}/api/cart/clear`, {
                          method: "POST",
                          headers: { "x-session-id": sessionId }
                        });
                      } catch (err) {
                        console.error("Cart clear request failed:", err);
                      }
                      // Simulate payment delay
                      setTimeout(() => {
                        setIsCheckoutLoading(false);
                        setIsCheckoutSuccess(true);
                        setOrderNumber(`LUM-${Math.floor(100000 + Math.random() * 900000)}`);
                        setCart([]); // Clear client-side cart
                      }, 1800);
                    }}
                    className="flex-1 overflow-y-auto p-6 space-y-6"
                  >
                    {/* Items Summary list */}
                    <div className="bg-stone-50 border border-stone-200/50 rounded-2xl p-4 space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">Order Summary</h4>
                      <div className="space-y-2 max-h-[120px] overflow-y-auto pr-2">
                        {cart.map((item) => (
                          <div key={item.product._id} className="flex justify-between text-xs">
                            <span className="text-stone-700 truncate max-w-[280px]">{item.product.title} (x{item.quantity})</span>
                            <span className="font-semibold text-stone-900">${(item.product.price * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                      <div className="border-t border-stone-200/50 pt-2 flex justify-between text-sm font-bold text-stone-900">
                        <span>Total Due</span>
                        <span>${calculateTotal().toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Shipping Info inputs */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">Shipping Details</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-stone-400 uppercase">Email Address</label>
                          <input
                            required
                            type="email"
                            placeholder="client@gmail.com"
                            value={checkoutEmail}
                            onChange={(e) => setCheckoutEmail(e.target.value)}
                            className="w-full text-xs p-3 border border-stone-200 rounded-xl focus:outline-none focus:border-stone-900 bg-stone-50/50"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-stone-400 uppercase">Full Name</label>
                          <input
                            required
                            type="text"
                            placeholder="John Doe"
                            value={checkoutName}
                            onChange={(e) => setCheckoutName(e.target.value)}
                            className="w-full text-xs p-3 border border-stone-200 rounded-xl focus:outline-none focus:border-stone-900 bg-stone-50/50"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-stone-400 uppercase">Delivery Address</label>
                        <input
                          required
                          type="text"
                          placeholder="123 Luxury Ave, Suite 100"
                          value={checkoutAddress}
                          onChange={(e) => setCheckoutAddress(e.target.value)}
                          className="w-full text-xs p-3 border border-stone-200 rounded-xl focus:outline-none focus:border-stone-900 bg-stone-50/50"
                        />
                      </div>
                    </div>

                    {/* Payment Info inputs */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">Secure Payment</h4>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-stone-400 uppercase">Card Number</label>
                        <input
                          required
                          type="text"
                          maxLength="19"
                          placeholder="•••• •••• •••• ••••"
                          value={checkoutCard}
                          onChange={(e) => setCheckoutCard(e.target.value)}
                          className="w-full text-xs p-3 border border-stone-200 rounded-xl focus:outline-none focus:border-stone-900 bg-stone-50/50 font-mono"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-stone-400 uppercase">Expiration Date</label>
                          <input
                            required
                            type="text"
                            maxLength="5"
                            placeholder="MM/YY"
                            value={checkoutExpiry}
                            onChange={(e) => setCheckoutExpiry(e.target.value)}
                            className="w-full text-xs p-3 border border-stone-200 rounded-xl focus:outline-none focus:border-stone-900 bg-stone-50/50 font-mono"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-stone-400 uppercase">CVC</label>
                          <input
                            required
                            type="password"
                            maxLength="3"
                            placeholder="•••"
                            value={checkoutCvc}
                            onChange={(e) => setCheckoutCvc(e.target.value)}
                            className="w-full text-xs p-3 border border-stone-200 rounded-xl focus:outline-none focus:border-stone-900 bg-stone-50/50 font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isCheckoutLoading}
                      className="w-full py-4 rounded-full bg-primary hover:bg-stone-850 text-white font-bold text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2"
                    >
                      {isCheckoutLoading ? (
                        <>
                          <div className="w-4.5 h-4.5 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                          <span>Processing transaction...</span>
                        </>
                      ) : (
                        <span>Complete Secure Payment</span>
                      )}
                    </button>
                  </form>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Floating Chat Assistant */}
      <ChatWidget
        catalog={catalog}
        cart={cart}
        onCartUpdate={setCart}
      />
    </div>
  );
}

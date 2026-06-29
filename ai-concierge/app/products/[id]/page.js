"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, X, ArrowLeft, Star, ShieldCheck, Heart, Sparkles, Check } from "lucide-react";
import ChatWidget from "../../../components/ChatWidget";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// Helper to render beautiful placeholder SVGs if image fails
const ProductImagePlaceholder = ({ category }) => {
  let gradientColors = "from-orange-200 to-amber-100";
  if (category === "cleanser") gradientColors = "from-teal-200 to-emerald-100";
  if (category === "moisturizer") gradientColors = "from-rose-200 to-pink-100";
  if (category === "bundle") gradientColors = "from-indigo-200 to-violet-100";
  if (category === "toner") gradientColors = "from-sky-200 to-blue-100";

  return (
    <div className={`w-full h-full bg-gradient-to-tr ${gradientColors} flex items-center justify-center`}>
      <ShoppingBag className="w-12 h-12 text-stone-600/30" />
    </div>
  );
};

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id;

  const [product, setProduct] = useState(null);
  const [catalog, setCatalog] = useState([]);
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [imageError, setImageError] = useState(false);
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

  useEffect(() => {
    const fetchData = async () => {
      let sId = localStorage.getItem("luminara_session_id");
      if (!sId) {
        sId = "session_" + Math.random().toString(36).substring(2, 15);
        localStorage.setItem("luminara_session_id", sId);
      }
      setSessionId(sId);

      if (!id) return;
      try {
        // Fetch current product
        const prodRes = await fetch(`${API_URL}/api/products/${id}`);
        if (!prodRes.ok) throw new Error("Product not found");
        const prodData = await prodRes.json();
        setProduct(prodData.product);

        // Fetch full catalog (for chat widget lookup)
        const catalogRes = await fetch(`${API_URL}/api/products`);
        const catalogData = await catalogRes.json();
        setCatalog(catalogData.products || []);

        // Fetch user cart
        const cartRes = await fetch(`${API_URL}/api/cart`, {
          headers: { "x-session-id": sId },
        });
        const cartData = await cartRes.json();
        setCart(cartData.cart || []);
      } catch (err) {
        console.error("Error loading product details:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleAddToCart = async (pId = id) => {
    try {
      setIsAdding(true);
      const res = await fetch(`${API_URL}/api/cart`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-session-id": sessionId,
        },
        body: JSON.stringify({ productId: pId, quantity: 1 }),
      });
      const data = await res.json();
      if (data.success) {
        setCart(data.cart);
        if (pId === id) {
          setAdded(true);
          setTimeout(() => setAdded(false), 2000);
        }
      }
    } catch (err) {
      console.error("Error adding to cart:", err);
    } finally {
      setIsAdding(false);
    }
  };

  const handleBuyNow = async () => {
    await handleAddToCart();
    setIsCheckoutOpen(true);
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  };

  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-50/50 flex flex-col justify-between">
        <header className="sticky top-0 bg-white/70 backdrop-blur-md border-b border-stone-200/50 px-6 py-4 flex items-center justify-between">
          <span className="font-serif font-black tracking-widest text-xl text-stone-900">L U M I N A R A</span>
        </header>
        <main className="flex-1 max-w-7xl mx-auto w-full py-12 px-6 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
            <p className="text-sm text-stone-500 font-medium">Revealing formulation details...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-stone-50/50 flex flex-col justify-between">
        <header className="sticky top-0 bg-white/70 backdrop-blur-md border-b border-stone-200/50 px-6 py-4 flex items-center justify-between">
          <span className="font-serif font-black tracking-widest text-xl text-stone-900">L U M I N A R A</span>
        </header>
        <main className="flex-1 max-w-7xl mx-auto w-full py-24 px-6 text-center space-y-6">
          <h2 className="text-3xl font-serif font-bold text-stone-900">Formulation Not Found</h2>
          <p className="text-stone-600 text-sm max-w-md mx-auto">
            The requested product details could not be retrieved. It may have been archived or is temporarily unavailable.
          </p>
          <Link href="/" className="inline-flex items-center gap-2 text-primary font-semibold text-sm hover:underline">
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Collection</span>
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50/50 flex flex-col selection:bg-primary/10">
      {/* Header / Navbar */}
      <header className="sticky top-0 z-40 bg-white/70 backdrop-blur-md border-b border-stone-200/50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Link href="/" className="font-serif font-black tracking-widest text-xl text-stone-900 hover:opacity-80 transition-opacity">
            L U M I N A R A
          </Link>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-xs font-semibold uppercase tracking-widest text-stone-600">
          <Link href="/#collection" className="hover:text-primary transition-colors">The Collection</Link>
          <Link href="/#philosophy" className="hover:text-primary transition-colors">Skincare Philosophy</Link>
          <Link href="/#science" className="hover:text-primary transition-colors">Science & Formulations</Link>
        </nav>

        <div className="flex items-center gap-4">
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

      {/* Main Details Panel */}
      <main className="flex-1 max-w-7xl mx-auto w-full py-12 px-6 md:px-12 lg:px-24">
        {/* Back Link */}
        <Link href="/" className="inline-flex items-center gap-2 text-stone-650 hover:text-primary font-semibold text-xs tracking-wider uppercase mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Collection</span>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left Product Image container */}
          <div className="lg:col-span-6">
            <div className="w-full aspect-[4/3] sm:aspect-square relative rounded-3xl overflow-hidden border border-stone-200/50 shadow-md bg-white">
              {product.image_url && !imageError ? (
                <Image
                  src={product.image_url}
                  alt={product.title}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  onError={() => setImageError(true)}
                  className="object-cover"
                />
              ) : (
                <ProductImagePlaceholder category={product.category} />
              )}
            </div>
          </div>

          {/* Right Product Details Info container */}
          <div className="lg:col-span-6 space-y-6">
            <div>
              <span className="text-xs font-bold tracking-widest uppercase text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                {product.category}
              </span>
              <h1 className="text-3xl md:text-5xl font-serif font-bold text-stone-950 mt-3 leading-tight">
                {product.title}
              </h1>
              <div className="flex items-center gap-1.5 mt-3 text-amber-500">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star key={n} className="w-4 h-4 fill-current" />
                ))}
                <span className="text-xs text-stone-500 font-semibold ml-2">4.9 (42 Client Reviews)</span>
              </div>
            </div>

            <div className="text-2xl font-bold text-stone-900 border-y border-stone-200/50 py-4">
              ${product.price.toFixed(2)}
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-stone-900">About the Formulation</h3>
              <p className="text-stone-600 text-sm md:text-base leading-relaxed">
                {product.description}
              </p>
              <p className="text-stone-600 text-sm md:text-base leading-relaxed">
                Our skin specialists recommend using this daily to target hydration levels, balance the skin microbiome, and protect against cellular stress without causing dynamic irritation.
              </p>
            </div>

            {/* Quality Badges */}
            <div className="grid grid-cols-3 gap-3 border-t border-stone-200/50 pt-6">
              {[
                { title: "Dermatologist Tested", desc: "Safe for sensitive skin" },
                { title: "100% Organic", desc: "Pure plant actives" },
                { title: "Cruelty Free", desc: "Ethically engineered" }
              ].map((badge, index) => (
                <div key={index} className="p-3 bg-stone-100/60 rounded-xl space-y-1 text-center">
                  <ShieldCheck className="w-5 h-5 text-primary mx-auto" />
                  <h4 className="text-[10px] font-bold text-stone-900 leading-tight">{badge.title}</h4>
                  <p className="text-[9px] text-stone-400 leading-none">{badge.desc}</p>
                </div>
              ))}
            </div>

            {/* Add to Cart CTA */}
            <div className="flex items-center gap-4 pt-4">
              <button
                onClick={() => handleAddToCart()}
                disabled={isAdding}
                className={`flex-1 py-3.5 rounded-full text-sm font-bold tracking-wide uppercase transition-all flex items-center justify-center gap-2 ${
                  added
                    ? "bg-emerald-600 text-white"
                    : "bg-primary text-white hover:bg-stone-800"
                }`}
              >
                {added ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Added</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4" />
                    <span>{isAdding ? "Adding..." : "Add to Cart"}</span>
                  </>
                )}
              </button>
              
              <button
                onClick={handleBuyNow}
                className="flex-1 py-3.5 rounded-full text-sm font-bold tracking-wide uppercase transition-all bg-stone-900 text-white hover:bg-stone-800 flex items-center justify-center"
              >
                Buy Now
              </button>
            </div>

            {/* Interactive AI Prompt Section */}
            <div className="bg-gradient-to-tr from-stone-900 to-stone-950 text-white p-5 rounded-2xl border border-white/5 space-y-3">
              <div className="flex items-center gap-2 text-amber-100">
                <Sparkles className="w-4 h-4" />
                <h4 className="font-serif text-sm font-bold">Ask AI Concierge about this product</h4>
              </div>
              <p className="text-[11px] text-stone-450 leading-relaxed">
                Not sure how to incorporate this formulation into your routine? Open the chat assistant in the bottom-right and ask:
              </p>
              <button
                onClick={() => {
                  window.dispatchEvent(new CustomEvent("open-chat", { detail: `Is ${product.title} safe to use with retinol?` }));
                }}
                className="w-full text-left p-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-[11px] font-medium transition-colors text-white/90 border border-white/5 italic font-medium"
              >
                &ldquo;How should I use the {product.title}?&rdquo;
              </button>
            </div>
          </div>
        </div>
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
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-black z-50"
            />
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

              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                    <ShoppingBag className="w-12 h-12 text-stone-300" />
                    <h4 className="font-serif font-bold text-stone-900">Your cart is empty</h4>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div key={item.product._id} className="flex gap-4 p-3 bg-stone-50 rounded-xl border border-stone-200/40">
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-stone-200 flex-shrink-0 flex items-center justify-center">
                        <ShoppingBag className="w-5 h-5 text-stone-400" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-bold text-stone-955 truncate leading-snug">{item.product.title}</h4>
                        <span className="text-xs text-stone-500">Qty: {item.quantity}</span>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-sm font-semibold text-stone-900">${(item.product.price * item.quantity).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

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
                    className="px-8 py-3 rounded-full bg-primary hover:bg-stone-855 text-white font-semibold text-xs tracking-wider uppercase transition-colors"
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

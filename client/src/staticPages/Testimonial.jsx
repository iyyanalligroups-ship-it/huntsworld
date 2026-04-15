import React, { useState, useEffect, useContext, useRef } from "react";
import axios from "axios";
import { AuthContext } from "@/modules/landing/context/AuthContext";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Star, 
  MessageSquare, 
  X, 
  ArrowLeft, 
  CheckCircle2, 
  ShieldCheck, 
  Search, 
  Zap,
  Quote
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

// Badge color function
const getRatingColor = (rating) => {
  if (rating >= 4.5) return "bg-emerald-500 text-white";
  if (rating >= 3) return "bg-amber-500 text-white";
  if (rating > 0) return "bg-rose-500 text-white";
  return "bg-slate-200 text-slate-700";
};

// Star Rating component
function StarRating({ rating, onRate }) {
  return (
    <div className="space-y-3">
      <Label className="text-sm font-semibold text-slate-700">How would you rate your experience?</Label>
      <div className="flex items-center space-x-3">
        <div className="flex relative group">
          {[1, 2, 3, 4, 5].map((star) => (
            <div key={star} className="relative">
              <div
                className="absolute left-0 top-0 w-1/2 h-full z-10 cursor-pointer"
                onClick={() => onRate(star - 0.5)}
              />
              <div
                className="absolute right-0 top-0 w-1/2 h-full z-10 cursor-pointer"
                onClick={() => onRate(star)}
              />
              <motion.div
                whileHover={{ scale: 1.2, rotate: 10 }}
                whileTap={{ scale: 0.9 }}
              >
                <Star
                  size={32}
                  className={`${rating >= star
                    ? "text-yellow-400"
                    : rating >= star - 0.5
                      ? "text-yellow-200"
                      : "text-slate-200"
                    } transition-colors duration-200`}
                  fill={
                    rating >= star
                      ? "#facc15"
                      : rating >= star - 0.5
                        ? "#fef08a"
                        : "none"
                  }
                />
              </motion.div>
            </div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className={cn(
            "rounded-full px-4 py-1.5 text-xs font-bold shadow-sm ring-1 ring-inset ring-white/20 transition",
            getRatingColor(rating)
          )}
        >
          {rating.toFixed(1)} / 5.0
        </motion.div>
      </div>
    </div>
  );
}

function Testimonial() {
  const { user, token } = useContext(AuthContext);
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState("");
  const [testimonials, setTestimonials] = useState([]);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const navigate = useNavigate();
  const formRef = useRef(null);

  useEffect(() => {
    if (showForm && formRef.current) {
      setTimeout(() => {
        formRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  }, [showForm]);

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/testimonialweb`);
      setTestimonials(response.data.testimonials || []);
    } catch (err) {
      setError("Failed to fetch testimonials");
      setTestimonials([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating < 0.5 || rating > 5) {
      setError("Please select a rating between 0.5 and 5");
      return;
    }
    if (!user?.user?._id) {
      setError("You must be logged in to submit a testimonial");
      return;
    }
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/testimonialweb`,
        { user_id: user.user._id, rating, message },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTestimonials([...(testimonials || []), response.data.testimonial]);
      setRating(0);
      setMessage("");
      setError(null);
      setShowForm(false);
    } catch (err) {
      setError("Failed to submit testimonial");
    }
  };

  const avgRating = testimonials.length > 0
    ? (testimonials.reduce((sum, t) => sum + t.rating, 0) / testimonials.length).toFixed(1)
    : "0.0";

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-indigo-100 pb-20">
      
      {/* Back Button */}
      <div className="container mx-auto pt-6 px-6">
        <Button
          type="button"
          onClick={() => navigate(-1)}
          variant="ghost"
          className="group hover:bg-slate-200/50 text-slate-600 transition-all flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Platform
        </Button>
      </div>

      {/* Hero Section */}
      <section className="mt-10 overflow-hidden relative">
        <div className="container mx-auto px-6">
          <div className="bg-[#0c1f4d] rounded-3xl overflow-hidden relative shadow-2xl shadow-indigo-200">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10 pointer-events-none">
              <div className="absolute top-0 left-0 w-64 h-64 bg-white/20 blur-3xl -translate-x-1/2 -translate-y-1/2 rounded-full" />
              <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-500/20 blur-3xl translate-x-1/2 translate-y-1/2 rounded-full" />
            </div>

            <div className="relative z-10 p-8 md:p-16 flex flex-col md:flex-row items-center justify-between gap-12">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-xl text-center md:text-left"
              >
                <Badge className="mb-4 bg-indigo-500/30 text-indigo-100 hover:bg-indigo-500/40 border-none px-4 py-1 text-xs uppercase tracking-widest font-bold">
                  Community Voices
                </Badge>
                <h1 className="text-4xl md:text-5xl font-extrabold text-white leading-tight mb-6">
                  Trusted by Thousands of <span className="text-indigo-400">Merchants</span>
                </h1>
                <p className="text-indigo-100 text-lg md:text-xl leading-relaxed opacity-90 mb-8">
                  Discover how Huntsworld is transforming businesses. Real stories from real people about their journey to success.
                </p>
                
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                  <Button
                    size="lg"
                    className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold h-14 px-8 rounded-2xl shadow-lg shadow-indigo-500/30"
                    onClick={() => setShowForm(!showForm)}
                  >
                    {showForm ? <X className="mr-2" /> : <MessageSquare className="mr-2" />}
                    {showForm ? "Cancel Review" : "Write a Review"}
                  </Button>
                  
                  <div className="flex items-center gap-3 px-6 py-3 bg-white/5 rounded-2xl backdrop-blur-md border border-white/10">
                    <div className="text-2xl font-bold text-white">{avgRating}</div>
                    <div className="flex text-yellow-400">
                      {[1,2,3,4,5].map(i => <Star key={i} size={14} fill={i <= Math.floor(avgRating) ? "currentColor" : "none"} />)}
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="hidden lg:block relative"
              >
                <div className="w-80 h-80 bg-indigo-600/30 rounded-full flex items-center justify-center relative overflow-hidden ring-8 ring-white/5">
                  <Quote size={120} className="text-white/10 absolute -top-10 -left-10" />
                  <div className="text-center space-y-2">
                    <div className="text-6xl font-black text-white">{testimonials.length}</div>
                    <div className="text-indigo-200 font-medium uppercase tracking-tighter">Verified Reviews</div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Review Form (AnimatePresence) */}
      <AnimatePresence>
        {showForm && (
          <motion.section 
            ref={formRef}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="container mx-auto px-6 overflow-hidden"
          >
            <div className="mt-8 p-8 bg-white rounded-3xl border border-slate-200 shadow-xl max-w-2xl mx-auto">
              <h3 className="text-2xl font-bold text-slate-900 mb-6">Create your review</h3>
              <form onSubmit={handleSubmit} className="space-y-6">
                <StarRating rating={rating} onRate={setRating} />

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700">Tell us about your experience</Label>
                  <Textarea
                    placeholder="Share your thoughts with the community..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={5}
                    required
                    className="w-full rounded-2xl border-slate-200 focus:ring-indigo-500 focus:border-indigo-500 resize-none transition-all p-4"
                  />
                </div>

                {error && (
                  <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="p-4 bg-rose-50 rounded-xl border border-rose-100 flex items-center gap-3 text-rose-600 text-sm"
                  >
                    <AlertCircle size={18} /> {error}
                  </motion.div>
                )}

                <Button
                  type="submit"
                  size="lg"
                  className="w-full bg-slate-900 hover:bg-black text-white font-bold h-14 rounded-2xl"
                  disabled={!user?.user}
                >
                  <Zap className="mr-2 w-4 h-4 fill-white" /> Post Testimonial
                </Button>
                {!user?.user && <p className="text-center text-xs text-slate-500 mt-2">Login required to post a review.</p>}
              </form>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Feedback SOP Section */}
      <section className="container mx-auto px-6 mt-20">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">How we handle your feedback</h2>
          <div className="w-16 h-1 bg-indigo-500 mx-auto mt-4 rounded-full" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              title: "Verification Policy",
              desc: "Every review is checked against our merchant database to ensure authenticity and real experience.",
              icon: ShieldCheck,
              color: "text-blue-500",
              bg: "bg-blue-50"
            },
            {
              title: "Actionable Insights",
              desc: "Critical feedback is directed to our product team immediately for system improvements and feature updates.",
              icon: Zap,
              color: "text-amber-500",
              bg: "bg-amber-50"
            },
            {
              title: "Transparency First",
              desc: "We display all genuine feedback, positive or negative, to maintain the integrity of our merchant platform.",
              icon: CheckCircle2,
              color: "text-emerald-500",
              bg: "bg-emerald-50"
            }
          ].map((item, idx) => (
            <motion.div 
              key={idx}
              whileHover={{ y: -5 }}
              className="p-8 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group"
            >
              <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110", item.bg, item.color)}>
                <item.icon size={28} />
              </div>
              <h4 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h4>
              <p className="text-slate-600 leading-relaxed text-sm">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Testimonials List */}
      <section className="container mx-auto px-6 mt-20">
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-2xl font-bold text-slate-900">Recent Testimonials</h2>
        </div>

        {testimonials.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-3xl border border-dashed border-slate-300">
            <Quote className="mx-auto mb-4 text-slate-200" size={48} />
            <p className="text-slate-500">Be the first to share your story!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial, idx) => (
              <motion.div
                key={testimonial._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className="h-full border-none shadow-lg shadow-slate-200/50 rounded-3xl overflow-hidden hover:shadow-xl transition-all duration-300 group">
                  <div className="h-2 bg-indigo-500/10 group-hover:bg-indigo-500 transition-colors" />
                  <CardHeader className="p-8 pb-4">
                    <div className="flex gap-1 mb-4">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star
                          key={i}
                          size={16}
                          className={cn(
                            "transition-colors",
                            i <= Math.floor(testimonial.rating) ? "text-yellow-400 fill-yellow-400" :
                            i - 0.5 <= testimonial.rating ? "text-yellow-300" : "text-slate-200"
                          )}
                        />
                      ))}
                    </div>
                    <div className="relative">
                      <Quote className="absolute -top-2 -left-2 text-indigo-500/5" size={40} />
                      <p className="text-slate-700 leading-relaxed relative z-10 font-medium italic">
                        "{testimonial.message}"
                      </p>
                    </div>
                  </CardHeader>
                  <CardContent className="p-8 pt-0 mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm uppercase">
                        {testimonial.user_id?.name?.[0] || "A"}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-900">
                          {testimonial.user_id?.name || "Verified Merchant"}
                        </span>
                        <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                          {testimonial.createdAt ? new Date(testimonial.createdAt).toLocaleDateString() : "Active Member"}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default Testimonial;

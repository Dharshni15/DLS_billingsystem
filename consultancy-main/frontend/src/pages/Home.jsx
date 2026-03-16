import React from 'react'
import { motion } from 'framer-motion'

export default function Home() {
  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <h2 className="text-3xl font-extrabold tracking-tight">Sri Dhanalakshmi Stores</h2>
        <p className="text-white/70 mt-1">Best Hardware Shop in Namakkal</p>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1, duration: 0.4 }} className="card overflow-hidden">
        <img src="/poster.jpg" alt="Store Poster" className="w-full h-auto object-cover" />
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.35 }} className="card p-5">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div>
              <div className="text-sm text-white/60">Address</div>
              <div className="text-white">108, Salem Road Corner, Namakkal, Tamil Nadu, India - 637001</div>
            </div>
            <div className="flex flex-wrap gap-2">
              <a href="tel:9443385626" className="px-3 py-2 rounded bg-white/10 hover:bg-white/20 transition">Call: 9443385626</a>
              <a href="https://wa.me/+919944001637" target="_blank" rel="noreferrer" className="px-3 py-2 rounded bg-green-600/80 hover:bg-green-600 transition">WhatsApp: 9944001637</a>
              <a href="mailto:dhanalakshmistore@gmail.com" className="px-3 py-2 rounded bg-white/10 hover:bg-white/20 transition">Email</a>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-sm text-white/80">Working Hours: 9:00 AM – 5:00 PM</span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-sm text-white/60">About Us</div>
            <p className="text-white/80 leading-relaxed">
              Trusted destination for quality hardware and home improvement supplies in Namakkal. We pride ourselves on fair pricing,
              reliable products, and friendly service. Visit us for a wide range of tools and essentials for your next project.
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.35 }} className="grid md:grid-cols-3 gap-4">
        <div className="card p-4">
          <div className="text-white font-semibold">Quality Assured</div>
          <div className="text-white/70 text-sm mt-1">Genuine brands and durable hardware for professionals and DIY enthusiasts.</div>
        </div>
        <div className="card p-4">
          <div className="text-white font-semibold">Friendly Support</div>
          <div className="text-white/70 text-sm mt-1">Personalized assistance to help you find exactly what you need.</div>
        </div>
        <div className="card p-4">
          <div className="text-white font-semibold">Convenient Hours</div>
          <div className="text-white/70 text-sm mt-1">Open 9:00 AM to 5:00 PM for your shopping convenience.</div>
        </div>
      </motion.div>
    </div>
  )
}

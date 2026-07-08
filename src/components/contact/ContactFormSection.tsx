
"use client";

import { motion } from "motion/react";
import { MapPin, Mail, Phone, Clock, ArrowRight, ExternalLink } from "lucide-react";
import { FaInstagram, FaLinkedinIn, FaXTwitter, FaFacebookF } from "react-icons/fa6";
import Link from "next/link";

export default function ContactLayout() {
  const bentoItems = [
    { icon: MapPin, title: "Headquarters", desc: "Cyber Hub, Gurugram", href: "#map", isLink: true },
    { icon: Mail, title: "Email Us", desc: "sales@allnewlaunches.com", href: "mailto:sales@allnewlaunches.com", isLink: true },
    { icon: Phone, title: "Call Us", desc: "+91 98765 43210", href: "tel:+919876543210", isLink: true },
    { icon: Clock, title: "Working Hours", desc: "Mon - Sat: 10AM - 7PM", href: "#", isLink: false },
  ];

  return (
    <section className="bg-slate-50 px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl">
        
        {/* 1. Heading & Subheading */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          viewport={{ once: true, margin: "-50px" }}
          className="mb-16 text-center"
        >
          <h2 className="mb-4 font-['Plus_Jakarta_Sans'] text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Get in touch with our experts
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-slate-500">
            Prefer a direct conversation? Visit our office or reach out via phone or email. We are here to answer your questions and guide your next move.
          </p>
        </motion.div>

        {/* 2. Bento Tabs */}
        <div className="mb-24 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {bentoItems.map((item, index) => {
            const Content = (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1, ease: "easeOut" }}
                viewport={{ once: true }}
                whileHover={{ y: -5, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="group relative flex h-full cursor-pointer flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/60 bg-white p-6 shadow-sm transition-all hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/5"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white">
                  <item.icon size={24} />
                </div>
                <div>
                  <h3 className="font-['Plus_Jakarta_Sans'] text-lg font-bold text-slate-900 transition-colors group-hover:text-blue-600">{item.title}</h3>
                  <p className="mt-1 text-sm text-slate-500">{item.desc}</p>
                </div>
                {item.isLink && (
                  <ExternalLink size={16} className="absolute right-6 top-6 text-slate-300 opacity-0 transition-opacity group-hover:opacity-100" />
                )}
              </motion.div>
            );

            return item.isLink ? (
              <Link href={item.href} key={index} className="block outline-none">
                {Content}
              </Link>
            ) : (
              <div key={index}>{Content}</div>
            );
          })}
        </div>

        {/* 3. Split Container: Image (Left) & Form (Right) */}
        <div className="mb-24 grid grid-cols-1 items-start gap-12 lg:grid-cols-2 lg:gap-16">
          
          {/* Left: Image & Socials */}
          <div className="flex flex-col gap-6">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="relative h-160 w-full overflow-hidden rounded-[2.5rem] bg-slate-200 shadow-xl"
            >
              <img 
                src="/assets/images/contact.jpg" 
                alt="Our premium office space"
                className="h-full w-full object-cover transition-transform duration-1000 hover:scale-105"
              />
              <div className="absolute inset-0 bg-linear-to-t from-slate-900/40 to-transparent"></div>
            </motion.div>

            {/* Social Icons using react-icons */}
            <motion.div 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex justify-center gap-6"
            >
              {[
                { icon: FaInstagram, label: "Instagram" },
                { icon: FaLinkedinIn, label: "LinkedIn" },
                { icon: FaXTwitter, label: "Twitter" },
                { icon: FaFacebookF, label: "Facebook" }
              ].map((item, i) => (
                <Link href="#" key={i} aria-label={item.label} className="group flex h-20 w-20 items-center justify-center rounded-3xl bg-white border border-slate-200 text-slate-500 transition-all hover:border-blue-500 hover:text-blue-600 hover:shadow-lg">
                  <item.icon size={30} />
                </Link>
              ))}
            </motion.div>
          </div>

          {/* Right: Form */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.2 }}
          >
            <form className="rounded-[2.5rem] border border-slate-100 bg-white p-8 shadow-xl shadow-slate-200/50 sm:p-12">
              <h3 className="mb-8 font-['Plus_Jakarta_Sans'] text-2xl font-bold text-slate-900">
                Send a Message
              </h3>
              
              <div className="mb-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">First Name</label>
                  <input type="text" placeholder="John" className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-5 py-4 text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Last Name</label>
                  <input type="text" placeholder="Doe" className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-5 py-4 text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10" />
                </div>
              </div>

              <div className="mb-6 space-y-2">
                <label className="text-sm font-semibold text-slate-700">Email Address</label>
                <input type="email" placeholder="john@example.com" className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-5 py-4 text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10" />
              </div>

              <div className="mb-6 space-y-2">
                <label className="text-sm font-semibold text-slate-700">Phone Number</label>
                <input type="tel" placeholder="+91 98765 43210" className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-5 py-4 text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10" />
              </div>

              <div className="mb-8 space-y-2">
                <label className="text-sm font-semibold text-slate-700">How can we help?</label>
                <textarea rows={4} placeholder="Tell us about the property you are looking for..." className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50/50 px-5 py-4 text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"></textarea>
              </div>
              
              <motion.button 
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-[#1d4ed8] px-8 py-4 font-semibold text-white transition hover:bg-blue-800"
              >
                Send Message 
                <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
              </motion.button>
            </form>
          </motion.div>
        </div>

        {/* 4. Map Section */}
        <motion.div
          id="map"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="group relative h-100 w-full overflow-hidden rounded-[2.5rem] border border-slate-200 bg-slate-200 shadow-xl shadow-slate-200/50"
        >
          <iframe 
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d112173.30872658825!2d76.953179!3d28.4228859!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390d19d582e38859%3A0x2cf5fe8e5c64b1e!2sGurugram%2C%20Haryana!5e0!3m2!1sen!2sin!4v1711100000000!5m2!1sen!2sin" 
            width="100%" 
            height="100%" 
            style={{ border: 0 }} 
            allowFullScreen={false} 
            loading="lazy" 
            referrerPolicy="no-referrer-when-downgrade"
            className="absolute inset-0 h-full w-full transition-all duration-700 ease-in-out grayscale group-hover:grayscale-0"
          ></iframe>
          
          <div className="absolute left-8 top-8 rounded-2xl bg-white/90 p-4 shadow-lg backdrop-blur-md transition-transform duration-500 group-hover:-translate-y-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <MapPin size={20} />
              </div>
              <div>
                <p className="font-bold text-slate-900">Headquarters</p>
                <p className="text-xs text-slate-500">Cyber Hub, Gurugram</p>
              </div>
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  );
}

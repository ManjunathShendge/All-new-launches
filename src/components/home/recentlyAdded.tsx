
"use client";

import { motion } from "motion/react";
import { 
  MapPin, 
  Heart, 
  Clock, 
  Star, 
  BedDouble, 
  Bath, 
  Maximize, 
  Phone,
  ChevronRight
} from "lucide-react";
import { useState } from "react";

const PROPERTIES = [
  {
    name: "Modern Family Villa",
    location: "Koramangala, Bangalore",
    price: "₹1.85 Cr",
    image: "/assets/images/Trust-image1.jpg", 
    isFeatured: true,
    beds: 4,
    baths: 3,
    sqft: "2,450",
    category: "Villas"
  },
  {
    name: "Premium Apartment",
    location: "Andheri West, Mumbai",
    price: "₹95 Lac",
    image: "/assets/images/Trust-image2.jpg",
    isFeatured: false,
    beds: 2,
    baths: 2,
    sqft: "1,100",
    category: "Apartments"
  },
  {
    name: "Luxury Penthouse",
    location: "Connaught Place, Delhi",
    price: "₹4.5 Cr",
    image: "/assets/images/Trust-image3.jpg",
    isFeatured: true,
    beds: 4,
    baths: 4,
    sqft: "3,800",
    category: "Apartments"
  },
  {
    name: "Cozy Studio Apartment",
    location: "Indiranagar, Bangalore",
    price: "₹45 Lac",
    image: "/assets/images/Trust-image4.jpg",
    isFeatured: false,
    beds: 1,
    baths: 1,
    sqft: "550",
    category: "Apartments"
  },
];

const TABS = ["All", "Apartments", "Villas", "Plots"];

export default function RecentlyAddedProperties() {
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("All");

  const filteredProperties = PROPERTIES.filter(
    (prop) => activeTab === "All" || prop.category === activeTab
  );

  return (
    <section className="relative overflow-hidden bg-background px-6 py-24 lg:px-10"> 
      <div className="relative mx-auto max-w-(--spacing-container-max)">
        
        {/* Header Section */}
        <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          > 
            <span className="inline-flex items-center gap-1.5 rounded-pill bg-(--secondary-fixed) px-3 py-1.5 text-label-sm text-(--on-secondary-fixed-variant)">
              <Clock size={14} className="text-(--error)" />
              Just Listed
            </span>

            <h2 className="mt-4 text-headline-lg text-foreground">
              Recently Added Properties
            </h2>

            <p className="mt-2 text-body-md text-muted">
              Fresh listings added in the last 24 hours
            </p>
          </motion.div>

          {/* Filter Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="flex items-center gap-2 rounded-pill bg-(--surface-container-lowest) p-1.5 shadow-[0_2px_10px_rgba(15,23,42,0.04)]"
          >
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`rounded-pill px-5 py-2 text-label-md transition-colors ${
                  activeTab === tab 
                    ? "bg-primary text-primary-foreground" 
                    : "text-muted hover:bg-(--surface-container-high)"
                }`}
              >
                {tab}
              </button>
            ))}
          </motion.div>
        </div>

        {/* Property Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {filteredProperties.map((item, i) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{
                duration: 0.5,
                delay: i * 0.1,
              }}
              className="
                group 
                overflow-hidden 
                rounded-card 
                border 
                border-(--border) 
                bg-(--surface-container-lowest) 
                shadow-[0_8px_20px_rgba(15,23,42,0.06)] 
                transition-all 
                duration-300 
                hover:border-[#316BF3]/20 
                hover:shadow-[0_20px_45px_rgba(15,23,42,0.10),0_35px_80px_rgba(15,23,42,0.08)]
              "
            >
              {/* Image Container */}
              <div className="relative h-48 overflow-hidden bg-(--surface-container-high)">
                <motion.img
                  src={item.image}
                  alt={item.name}
                  whileHover={{ scale: 1.05 }}
                  transition={{
                    duration: 0.5,
                    ease: "easeOut",
                  }}
                  className="h-full w-full object-cover"
                />

                {/* Featured Badge */}
                {item.isFeatured && (
                  <span className="absolute left-3 top-3 flex items-center gap-1 rounded-sm bg-[#ffc107] px-2.5 py-1 text-label-sm text-(--tertiary-container) shadow-sm">
                    <Star size={12} className="fill-(--tertiary-container) text-(--tertiary-container)" />
                    Featured
                  </span>
                )}

                {/* Wishlist Button (Restored opacity hover effect) */}
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() =>
                    setWishlist((prev) =>
                      prev.includes(item.name)
                        ? prev.filter((x) => x !== item.name)
                        : [...prev, item.name],
                    )
                  }
                  className="
                    absolute 
                    right-3 
                    top-3 
                    flex 
                    h-10 
                    w-10 
                    items-center 
                    justify-center  
                    rounded-pill 
                    bg-(--surface-container-lowest) 
                    opacity-0 
                    shadow-md 
                    transition-all  
                    duration-300 
                    group-hover:opacity-100 
                    hover:bg-(--surface-container-low)
                  "
                >
                  <Heart
                    size={16}
                    className={`transition-all duration-300 ${
                      wishlist.includes(item.name)
                        ? "fill-(--error) text-(--error)"
                        : "text-(--outline)"
                    }`}
                  />
                </motion.button>

                {/* Stats Overlay */}
                <div className="absolute bottom-3 left-3 flex items-center gap-3 rounded-md bg-(--inverse-surface)/70 px-2.5 py-1.5 text-label-sm text-(--inverse-on-surface) backdrop-blur-sm">
                  <div className="flex items-center gap-1">
                    <BedDouble size={14} />
                    <span>{item.beds}</span>
                  </div>
                  <div className="h-3 w-px bg-(--inverse-on-surface)/30" />
                  <div className="flex items-center gap-1">
                    <Bath size={14} />
                    <span>{item.baths}</span>
                  </div>
                  <div className="h-3 w-px bg-(--inverse-on-surface)/30" />
                  <div className="flex items-center gap-1">
                    <Maximize size={12} />
                    <span>{item.sqft} sqft</span>
                  </div>
                </div>
              </div>

              {/* Content Container */}
              <div className="p-5">
                <h3 className="text-body-lg font-bold text-foreground">
                  {item.name}
                </h3>

                <p className="mt-1.5 flex items-center gap-1.5 text-label-md text-muted">
                  <MapPin size={14} className="shrink-0" />
                  {item.location}
                </p>

                <div className="mt-4 flex items-center justify-between border-t border-(--border) pt-4">
                  <p className="text-headline-md text-primary">
                    {item.price}
                  </p>
                  
                  <button className="flex h-9 w-9 items-center justify-center rounded-md bg-(--secondary-fixed) text-(--on-secondary-fixed-variant) transition-colors hover:bg-(--secondary-fixed-dim)">
                    <Phone size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* View All Button */}
        <motion.div 
          className="mt-12 flex justify-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="group flex items-center gap-2 rounded-pill border-2 border-primary bg-transparent px-6 py-2.5 text-label-md text-primary transition-all hover:bg-primary hover:text-primary-foreground"
          >
            View All Properties
            <ChevronRight size={16} className="transition-transform group-hover:translate-x-1" />
          </motion.button>
        </motion.div>

      </div>
    </section>
  );
}

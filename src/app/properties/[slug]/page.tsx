import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  ChevronRight,
  MapPin,
  Star,
  Eye,
  Mail,
  Home as HomeIcon,
  CheckCircle2,
  Download,
  CalendarCheck,
  Heart,
  ArrowLeftRight,
  Share2,
  Printer,
  ShieldCheck,
  Ruler,
  CalendarClock,
  Car,
  LayoutGrid,
  Phone,
} from "lucide-react";
import { propertyApi } from "@/lib/api/property.api";
import { PropertyDetail } from "@/types/property-detail";
import { PropertyCard as PropertyCardType } from "@/types/property-card";
import {
  formatPriceRange,
  formatAreaRange,
  formatPricePerSqft,
  formatPossession,
  titleCase,
} from "@/lib/format";
import ImageGallery from "@/components/properties/detail/ImageGallery";
import PropertyTabs from "@/components/properties/detail/PropertyTabs";
import ContactForm from "@/components/properties/detail/ContactForm";
import ShareButtons from "@/components/properties/detail/ShareButtons";
import ReadMore from "@/components/properties/detail/ReadMore";
import SimilarCarousel from "@/components/properties/detail/SimilarCarousel";
import RecentlyViewedTracker from "@/components/properties/RecentlyViewedTracker";
import FloorPlanCarousel from "@/components/properties/detail/FloorPlanCarousel";
import { SITE_URL, SITE_NAME, absoluteUrl } from "@/lib/seo";

// Deterministic pseudo-live stats so each property shows stable, realistic numbers.
function liveStats(id: number) {
  return {
    viewing: 2 + (id % 8),
    inquiries: 5 + (id % 20),
    visits: 10 + (id % 40),
    rating: (4 + ((id % 9) + 1) / 10).toFixed(1), // 4.1 – 4.9
    reviews: 40 + (id % 200),
  };
}

// Extract a YouTube id from common URL shapes → embed URL, else null.
function getYouTubeEmbed(url: string | null): string | null {
  if (!url) return null;
  const m = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/
  );
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
}

async function getProperty(slug: string): Promise<PropertyDetail | null> {
  try {
    return await propertyApi.getPropertyDetail(slug);
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const property = await getProperty(slug);
  if (!property) return { title: "Property not found" };

  const place = [property.locality, property.city].filter(Boolean).join(", ");
  const title = place ? `${property.title} — ${place}` : property.title;
  const description =
    property.description?.replace(/\s+/g, " ").trim().slice(0, 155) ||
    `Explore ${property.title}${place ? ` in ${place}` : ""} — pricing, floor plans, amenities and RERA details on ${SITE_NAME}.`;
  const url = `${SITE_URL}/properties/${property.slug}`;
  const image = property.primaryImage ? absoluteUrl(property.primaryImage) : undefined;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      title,
      description,
      images: image ? [image] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

function InfoChip({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 text-[#2563EB]">{icon}</span>
      <div>
        <p className="text-xs text-muted">{label}</p>
        <p className="text-sm font-semibold text-foreground">{value}</p>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-(--border) py-3 last:border-0">
      <span className="text-sm text-muted">{label}</span>
      <span className="text-right text-sm font-semibold text-foreground">{value}</span>
    </div>
  );
}

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const property = await getProperty(slug);
  if (!property) notFound();

  const stats = liveStats(property.id);
  const location = [property.locality, property.city].filter(Boolean).join(", ");
  const galleryUrls = property.gallery.map((g) => g.imageUrl);
  const configs = property.configurations.length ? property.configurations.join(", ") : "N/A";
  const possession = formatPossession(property.possession);
  const projectStatus = property.listingEntity === "new_project" ? "New Launch" : titleCase(property.transactionType);

  const agentName =
    property.agent?.name ?? property.builderName ?? property.projectName ?? "Listing Agent";
  const agentRole =
    property.agent?.accountType === "owner" ? "Owner" : "Listing Agent";
  const agentInitials =
    agentName
      .split(/\s+/)
      .map((w) => w[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "LA";

  // Normalise the agent phone into a wa.me-friendly number (default India +91).
  const agentPhoneDigits = property.agent?.phone?.replace(/\D/g, "") ?? "";
  const whatsappNumber =
    agentPhoneDigits.length === 10 ? `91${agentPhoneDigits}` : agentPhoneDigits || undefined;
  const callHref = agentPhoneDigits ? `tel:+${whatsappNumber}` : null;

  // Similar properties in the same city (fallback to latest), excluding this one.
  let similar: PropertyCardType[] = [];
  try {
    const { data } = await propertyApi.getPropertyListing({
      city: property.city ?? undefined,
      limit: 13,
    });
    similar = data.filter((p) => p.id !== property.id).slice(0, 12);
    if (similar.length === 0) {
      similar = (await propertyApi.getLatestProperties(13)).filter((p) => p.id !== property.id).slice(0, 12);
    }
  } catch {
    similar = [];
  }

  const highlights = [
    `Premium ${titleCase(property.propertyCategory) || "residential"} project in ${property.locality ?? property.city ?? "a prime location"}`,
    property.configurations.length ? `${configs} configurations available` : "Multiple configurations available",
    possession !== "N/A" ? `Possession expected by ${possession}` : "Ready for site visits",
    property.reraNumber ? `RERA Registered: ${property.reraNumber}` : "Verified listing",
  ];

  const mapQuery =
    property.latitude && property.longitude
      ? `${property.latitude},${property.longitude}`
      : property.address ?? location ?? property.title;

  // Build tab list from the sections that actually have content.
  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "details", label: "Details" },
    ...(property.amenityLabels.length ? [{ id: "amenities", label: "Amenities" }] : []),
    ...(property.floorPlans.length ? [{ id: "floor-plans", label: "Floor Plans" }] : []),
    ...(property.videoUrl || property.virtualTourUrl ? [{ id: "media", label: "Video & Tour" }] : []),
    { id: "location", label: "Location" },
    ...(similar.length ? [{ id: "similar", label: "Similar" }] : []),
  ];

  // Only include rows that actually have a value, so residential / commercial /
  // land listings each show a clean, relevant set (no rows full of "—").
  const sqft = (n: number | null) =>
    n ? `${n.toLocaleString("en-IN")} sq ft` : null;
  const detailRows = (
    [
      { label: "Price Range", value: formatPriceRange(property.minPrice, property.maxPrice) },
      property.pricePerSqft ? { label: "Price per Sq Ft", value: formatPricePerSqft(property.pricePerSqft) } : null,
      { label: "Property ID", value: property.propertyCode },
      { label: "Property Type", value: titleCase(property.propertyType) || "—" },
      property.projectName ? { label: "Project", value: property.projectName } : null,
      property.builderName ? { label: "Builder", value: property.builderName } : null,
      { label: "Locality", value: location || "—" },
      { label: "Area Range", value: formatAreaRange(property.minArea, property.maxArea) },
      sqft(property.carpetArea) ? { label: "Carpet Area", value: sqft(property.carpetArea)! } : null,
      sqft(property.superBuiltupArea) ? { label: "Super Built-up Area", value: sqft(property.superBuiltupArea)! } : null,
      property.configurations.length ? { label: "Configurations", value: configs } : null,
      property.bedrooms ? { label: "Bedrooms", value: String(property.bedrooms) } : null,
      property.bathrooms ? { label: "Bathrooms", value: String(property.bathrooms) } : null,
      property.balconies ? { label: "Balconies", value: String(property.balconies) } : null,
      property.floorNumber
        ? { label: "Floor", value: property.totalFloors ? `${property.floorNumber} of ${property.totalFloors}` : String(property.floorNumber) }
        : property.totalFloors ? { label: "Total Floors", value: String(property.totalFloors) } : null,
      property.facing ? { label: "Facing", value: property.facing } : null,
      property.furnishing ? { label: "Furnishing", value: property.furnishing } : null,
      property.parking != null ? { label: "Parking", value: String(property.parking) } : null,
      possession && possession !== "N/A" ? { label: "Possession", value: possession } : null,
      property.ownershipType ? { label: "Ownership", value: property.ownershipType } : null,
      property.reraNumber ? { label: "RERA ID", value: property.reraNumber } : null,
      property.landmarks ? { label: "Landmarks", value: property.landmarks } : null,
    ].filter(Boolean) as { label: string; value: string }[]
  );
  const detailMid = Math.ceil(detailRows.length / 2);
  const videoEmbed = getYouTubeEmbed(property.videoUrl);

  // Overview "quick facts": show only the chips that are relevant to THIS
  // listing (no "Configurations: N/A" on an office), capped at 5.
  const areaRange = formatAreaRange(property.minArea, property.maxArea);
  const meaningful = (v?: string | null): v is string =>
    !!v && v !== "—" && v.toUpperCase() !== "N/A";
  const quickFacts = (
    [
      { icon: <CheckCircle2 size={18} />, label: "Project Status", value: projectStatus },
      property.configurations.length ? { icon: <LayoutGrid size={18} />, label: "Configurations", value: configs } : null,
      property.bedrooms ? { icon: <HomeIcon size={18} />, label: "Bedrooms", value: `${property.bedrooms} BHK` } : null,
      meaningful(areaRange) ? { icon: <Ruler size={18} />, label: "Area Range", value: areaRange } : null,
      meaningful(possession) ? { icon: <CalendarClock size={18} />, label: "Possession", value: possession } : null,
      property.parking != null ? { icon: <Car size={18} />, label: "Parking", value: String(property.parking) } : null,
      property.furnishing ? { icon: <HomeIcon size={18} />, label: "Furnishing", value: property.furnishing } : null,
      { icon: <HomeIcon size={18} />, label: "Property Type", value: titleCase(property.propertyType) || "—" },
    ].filter(Boolean) as { icon: React.ReactNode; label: string; value: string }[]
  ).slice(0, 5);

  // Structured data — a real-estate listing so Google can show rich results
  // (price, location, images). Only include fields we actually have.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: property.title,
    description: property.description ?? undefined,
    url: `${SITE_URL}/properties/${property.slug}`,
    image: galleryUrls.length ? galleryUrls.map((u) => absoluteUrl(u)) : undefined,
    ...(location
      ? {
          address: {
            "@type": "PostalAddress",
            streetAddress: property.address ?? undefined,
            addressLocality: property.city ?? property.locality ?? undefined,
            addressRegion: property.state ?? undefined,
            postalCode: property.pincode ?? undefined,
            addressCountry: "IN",
          },
        }
      : {}),
    ...(property.latitude && property.longitude
      ? {
          geo: {
            "@type": "GeoCoordinates",
            latitude: property.latitude,
            longitude: property.longitude,
          },
        }
      : {}),
    ...(property.minPrice
      ? {
          offers: {
            "@type": "Offer",
            price: property.minPrice,
            priceCurrency: "INR",
            availability: "https://schema.org/InStock",
          },
        }
      : {}),
  };

  return (
    <main className="min-h-screen bg-(--surface) pb-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <RecentlyViewedTracker
        id={property.id}
        slug={property.slug}
        title={property.title}
        image={galleryUrls[0] ?? null}
        price={formatPriceRange(property.minPrice, property.maxPrice)}
        location={location || null}
      />
      <div className="mx-auto w-full max-w-[1600px] px-5 pt-6 sm:px-8 lg:px-10">
        {/* Breadcrumb — Properties > property name only */}
        <nav className="mb-5 flex items-center gap-1.5 text-sm text-muted">
          <Link href="/properties" className="hover:text-foreground">
            Properties
          </Link>
          <ChevronRight size={14} />
          <span className="line-clamp-1 font-medium text-foreground">{property.title}</span>
        </nav>

        <div className="flex flex-col gap-8 lg:flex-row">
          {/* LEFT column */}
          <div className="min-w-0 flex-1">
            <ImageGallery
              images={galleryUrls}
              isVerified={property.isVerified}
              transactionLabel={`For ${titleCase(property.transactionType)}`}
            />

            <div className="mt-6">
              <PropertyTabs tabs={tabs} />

              {/* Overview */}
              <section id="overview" className="scroll-mt-32">
                <div className="rounded-card border border-(--border) bg-(--surface-container-lowest) p-6">
                  <h2 className="text-xl font-bold text-foreground">About {property.title}</h2>
                  <div className="mt-3">
                    {property.description ? (
                      <ReadMore text={property.description} />
                    ) : (
                      <p className="text-sm text-muted">Details coming soon.</p>
                    )}
                  </div>

                  {/* Quick facts */}
                  <div className="mt-6 grid grid-cols-2 gap-5 border-t border-(--border) pt-6 sm:grid-cols-3 lg:grid-cols-5">
                    {quickFacts.map((f) => (
                      <InfoChip key={f.label} icon={f.icon} label={f.label} value={f.value} />
                    ))}
                  </div>
                </div>

                {/* Highlights */}
                <div className="mt-6">
                  <div className="rounded-card border border-(--border) bg-(--surface-container-lowest) p-6">
                    <h3 className="mb-4 text-lg font-bold text-foreground">Project Highlights</h3>
                    <ul className="flex flex-col gap-3">
                      {highlights.map((h, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-muted">
                          <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-[#2563EB]" />
                          {h}
                        </li>
                      ))}
                    </ul>

                    {property.propertyTypes.length > 0 && (
                      <div className="mt-5 border-t border-(--border) pt-5">
                        <p className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-muted">
                          Property Types Available
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {property.propertyTypes.map((t) => (
                            <span
                              key={t}
                              className="rounded-full border border-[#2563EB]/20 bg-[#2563EB]/5 px-3 py-1 text-xs font-medium text-[#2563EB]"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {property.configurations.length > 0 && (
                      <div className="mt-5 border-t border-(--border) pt-5">
                        <p className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-muted">
                          Available Configurations
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {property.configurations.map((c) => (
                            <span
                              key={c}
                              className="rounded-full border border-(--border) bg-(--surface-container-high) px-3 py-1 text-xs font-medium text-foreground"
                            >
                              {c}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </section>

              {/* Details */}
              <section id="details" className="mt-6 scroll-mt-32">
                <div className="rounded-card border border-(--border) bg-(--surface-container-lowest) p-6">
                  <h2 className="mb-4 text-xl font-bold text-foreground">Property Details</h2>
                  <div className="grid gap-x-10 sm:grid-cols-2">
                    <div>
                      {detailRows.slice(0, detailMid).map((r) => (
                        <DetailRow key={r.label} label={r.label} value={r.value} />
                      ))}
                    </div>
                    <div>
                      {detailRows.slice(detailMid).map((r) => (
                        <DetailRow key={r.label} label={r.label} value={r.value} />
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              {/* Amenities */}
              {property.amenityLabels.length > 0 && (
                <section id="amenities" className="mt-6 scroll-mt-32">
                  <div className="rounded-card border border-(--border) bg-(--surface-container-lowest) p-6">
                    <h2 className="mb-4 text-xl font-bold text-foreground">Amenities</h2>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
                      {property.amenityLabels.map((a) => (
                        <div key={a} className="flex items-center gap-2 text-sm text-foreground">
                          <CheckCircle2 size={16} className="shrink-0 text-[#2563EB]" />
                          <span>{a}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              )}

              {/* Floor Plans */}
              {property.floorPlans.length > 0 && (
                <section id="floor-plans" className="mt-6 scroll-mt-32">
                  <div className="rounded-card border border-(--border) bg-(--surface-container-lowest) p-6">
                    <h2 className="mb-4 text-xl font-bold text-foreground">Floor Plans</h2>
                    <FloorPlanCarousel plans={property.floorPlans} />
                  </div>
                </section>
              )}

              {/* Video & Virtual Tour */}
              {(property.videoUrl || property.virtualTourUrl) && (
                <section id="media" className="mt-6 scroll-mt-32">
                  <div className="rounded-card border border-(--border) bg-(--surface-container-lowest) p-6">
                    <h2 className="mb-4 text-xl font-bold text-foreground">Video & Tour</h2>
                    {property.videoUrl && (
                      <div className="overflow-hidden rounded-lg border border-(--border)">
                        {videoEmbed ? (
                          <iframe
                            title="Property video"
                            src={videoEmbed}
                            className="aspect-video w-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        ) : (
                          <video controls src={property.videoUrl} className="aspect-video w-full bg-black" />
                        )}
                      </div>
                    )}
                    {property.virtualTourUrl && (
                      <a
                        href={property.virtualTourUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#2563EB] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1D4ED8]"
                      >
                        <Eye size={16} /> Open Virtual Tour
                      </a>
                    )}
                  </div>
                </section>
              )}

              {/* Location */}
              <section id="location" className="mt-6 scroll-mt-32">
                <div className="rounded-card border border-(--border) bg-(--surface-container-lowest) p-6">
                  <h2 className="mb-1 text-xl font-bold text-foreground">Location</h2>
                  <p className="mb-4 flex items-center gap-1.5 text-sm text-muted">
                    <MapPin size={15} className="text-[#2563EB]" />
                    {property.address ?? location}
                  </p>
                  <div className="overflow-hidden rounded-lg border border-(--border)">
                    <iframe
                      title="Location map"
                      src={`https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&z=15&output=embed`}
                      className="h-72 w-full"
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  </div>
                </div>
              </section>

              {/* Similar */}
              {similar.length > 0 && (
                <section id="similar" className="mt-6 scroll-mt-32">
                  <SimilarCarousel properties={similar} />
                </section>
              )}
            </div>
          </div>

          {/* RIGHT sidebar */}
          <aside className="w-full shrink-0 lg:w-95">
            <div className="sticky top-21 flex flex-col gap-5">
              {/* Summary card */}
              <div className="rounded-card border border-(--border) bg-(--surface-container-lowest) p-6">
                <h1 className="text-2xl font-bold text-foreground">{property.title}</h1>
                {location && (
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
                    <MapPin size={15} className="text-[#2563EB]" />
                    {location}
                  </p>
                )}

                {/* Rating */}
                <div className="mt-3 flex items-center gap-2 text-sm">
                  <span className="font-semibold text-foreground">{stats.rating}</span>
                  <span className="flex items-center gap-0.5 text-amber-500">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={14} className="fill-amber-400 text-amber-400" />
                    ))}
                  </span>
                  <span className="text-muted">({stats.reviews} Reviews)</span>
                </div>

                {/* Live stat chips */}
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="flex items-center gap-1.5 rounded-full bg-(--surface-container-high) px-3 py-1.5 text-xs text-foreground">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                    {stats.viewing} viewing now
                  </span>
                  <span className="flex items-center gap-1.5 rounded-full bg-(--surface-container-high) px-3 py-1.5 text-xs text-foreground">
                    <Mail size={12} />
                    {stats.inquiries} inquiries this month
                  </span>
                  <span className="flex items-center gap-1.5 rounded-full bg-(--surface-container-high) px-3 py-1.5 text-xs text-foreground">
                    <HomeIcon size={12} />
                    {stats.visits} visits this month
                  </span>
                </div>

                {/* Price */}
                <div className="mt-5">
                  <p className="text-2xl font-bold text-foreground">
                    {formatPriceRange(property.minPrice, property.maxPrice)}
                  </p>
                  {formatPricePerSqft(property.pricePerSqft) && (
                    <p className="mt-1 text-sm text-muted">{formatPricePerSqft(property.pricePerSqft)}</p>
                  )}
                </div>

                {/* CTAs */}
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <button className="flex items-center justify-center gap-2 rounded-lg border border-[#2563EB] px-3 py-2.5 text-sm font-semibold text-[#2563EB] transition hover:bg-[#2563EB]/5">
                    <Download size={16} />
                    Brochure
                  </button>
                  <button className="flex items-center justify-center gap-2 rounded-lg bg-[#2563EB] px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1D4ED8]">
                    <CalendarCheck size={16} />
                    Schedule Visit
                  </button>
                </div>

                {/* Action row */}
                <div className="mt-5 grid grid-cols-4 gap-2 border-t border-(--border) pt-5 text-center text-xs text-muted">
                  {[
                    { icon: <Heart size={18} />, label: "Shortlist" },
                    { icon: <ArrowLeftRight size={18} />, label: "Compare" },
                    { icon: <Share2 size={18} />, label: "Share" },
                    { icon: <Printer size={18} />, label: "Print" },
                  ].map((a) => (
                    <button key={a.label} className="flex flex-col items-center gap-1.5 transition hover:text-[#2563EB]">
                      {a.icon}
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Contact agent */}
              <div className="rounded-card border border-(--border) bg-(--surface-container-lowest) p-6">
                {/* Listing agent header */}
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#2563EB]/10 text-sm font-bold text-[#2563EB]">
                    {agentInitials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                      {agentRole}
                    </p>
                    <p className="truncate text-sm font-semibold text-foreground">{agentName}</p>
                    <div className="mt-0.5 flex items-center gap-1">
                      <span className="flex items-center gap-0.5 text-amber-400">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            size={12}
                            className={
                              i < Math.round(Number(stats.rating))
                                ? "fill-amber-400 text-amber-400"
                                : "text-(--border)"
                            }
                          />
                        ))}
                      </span>
                      <span className="text-xs text-muted">{stats.rating}</span>
                    </div>
                  </div>
                  {callHref && (
                    <a
                      href={callHref}
                      aria-label={`Call ${agentName}`}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#2563EB]/20 text-[#2563EB] transition hover:bg-[#2563EB]/5"
                    >
                      <Phone size={16} />
                    </a>
                  )}
                </div>

                <h3 className="mb-4 mt-4 border-t border-(--border) pt-4 text-base font-semibold text-foreground">
                  Contact for Inquiry
                </h3>
                <ContactForm propertyId={property.id} propertyTitle={property.title} whatsappNumber={whatsappNumber} />
              </div>

              {/* RERA */}
              {property.reraNumber && (
                <div className="rounded-card border border-(--border) bg-(--surface-container-lowest) p-6">
                  <h3 className="mb-3 flex items-center gap-2 text-base font-semibold text-foreground">
                    <ShieldCheck size={18} className="text-green-600" />
                    RERA Details
                  </h3>
                  <p className="text-xs text-muted">RERA ID</p>
                  <p className="mb-4 break-all text-sm font-semibold text-foreground">{property.reraNumber}</p>
                  {property.reraWebsite && (
                    <a
                      href={property.reraWebsite}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full rounded-lg border border-(--border) py-2.5 text-center text-sm font-medium text-foreground transition hover:bg-(--surface-container-high)"
                    >
                      View on RERA
                    </a>
                  )}
                </div>
              )}

              {/* Share */}
              <div className="rounded-card border border-(--border) bg-(--surface-container-lowest) p-6">
                <h3 className="mb-4 text-base font-semibold text-foreground">Share this property</h3>
                <ShareButtons title={property.title} />
              </div>
            </div>
          </aside>
        </div>

        {/* Trust bar */}
        <div className="mt-12 grid grid-cols-2 gap-6 rounded-card border border-(--border) bg-(--surface-container-lowest) p-6 lg:grid-cols-4">
          {[
            { icon: <ShieldCheck size={22} />, title: "Verified Properties", sub: "100% verified listings" },
            { icon: <CheckCircle2 size={22} />, title: "No Brokerage", sub: "Direct from builder/owner" },
            { icon: <Eye size={22} />, title: "Best Price", sub: "Price match guarantee" },
            { icon: <Phone size={22} />, title: "Expert Support", sub: "24x7 customer support" },
          ].map((t) => (
            <div key={t.title} className="flex items-center gap-3">
              <span className="text-[#2563EB]">{t.icon}</span>
              <div>
                <p className="text-sm font-semibold text-foreground">{t.title}</p>
                <p className="text-xs text-muted">{t.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

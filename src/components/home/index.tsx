import HeroSection from "./hero";
import CategoriesSection from "./categories";
import TrustSection from "./Trust";
import FeaturedLaunches from "./new-launches";
import RecentlyAddedProperties from "./recentlyAdded";
import PremiumBuildersImageCarousel from "./buildersList";
import TrendingLocations from "./trendingLocations";
import HighROIInvestmentOpportunities from "./roi";
import WhyChooseUs from "./whyChooseUs";
import OurServicesPremium from "./ourServices";
import ScalableWallOfLove from "./testimonial";
import HomeBlogSection from "../blog/HomeBlogSection";
import PropertyCTASection from "./LeadCapture";
import FAQSection from "./faq";
import { propertyApi } from "@/lib/api/property.api";
import { getActiveShowcase } from "@/lib/actions/premium-showcase.action";
import { getTrendingLocations } from "@/lib/actions/trending.action";


export default async function HomeSection() {
  // Degrade gracefully — a transient Supabase read (e.g. token/clock skew)
  // should show empty sections, not crash the whole home page.
  const [featuredRes, latestRes, showcaseRes, trendingRes] =
    await Promise.allSettled([
      propertyApi.getFeaturedProperties(4),
      propertyApi.getLatestProperties(8),
      getActiveShowcase(),
      getTrendingLocations(6),
    ]);
  const featured = featuredRes.status === "fulfilled" ? featuredRes.value : [];
  const latest = latestRes.status === "fulfilled" ? latestRes.value : [];
  const showcase = showcaseRes.status === "fulfilled" ? showcaseRes.value : [];
  const trending = trendingRes.status === "fulfilled" ? trendingRes.value : [];

  return (
    <main>
      <HeroSection showcase={showcase} />
      <CategoriesSection />
      <TrustSection />
      <FeaturedLaunches properties={featured} />
      <RecentlyAddedProperties properties={latest} />
      <PremiumBuildersImageCarousel/>
      <TrendingLocations locations={trending} />
      <HighROIInvestmentOpportunities />
      <WhyChooseUs />
      <OurServicesPremium />
      <ScalableWallOfLove />
      <HomeBlogSection />
      <PropertyCTASection />
      <FAQSection />
    </main>
  );
}

      
 
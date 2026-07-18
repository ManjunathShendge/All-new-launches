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


export default async function HomeSection() {
  // Degrade gracefully — a transient Supabase read (e.g. token/clock skew)
  // should show empty sections, not crash the whole home page.
  const [featuredRes, latestRes, showcaseRes] = await Promise.allSettled([
    propertyApi.getFeaturedProperties(4),
    propertyApi.getLatestProperties(8),
    getActiveShowcase(),
  ]);
  const featured = featuredRes.status === "fulfilled" ? featuredRes.value : [];
  const latest = latestRes.status === "fulfilled" ? latestRes.value : [];
  const showcase = showcaseRes.status === "fulfilled" ? showcaseRes.value : [];

  return (
    <main>
      <HeroSection showcase={showcase} />
      <CategoriesSection />
      <TrustSection />
      <FeaturedLaunches properties={featured} />
      <RecentlyAddedProperties properties={latest} />
      <PremiumBuildersImageCarousel/>
      <TrendingLocations />
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

      
 
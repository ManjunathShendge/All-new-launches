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
import HomeBlogSection from "../blog/HomeBlogSection";
import PropertyCTASection from "./LeadCapture";
import FAQSection from "./faq";
import { getHomeData } from "@/lib/data/home.data";


export default async function HomeSection() {
  // All reads go through a cookie-free client (see home.data.ts) so this page
  // can be ISR-cached instead of dynamically rendered on every request. Each
  // read degrades to empty on failure, so a transient blip shows empty
  // sections, not a crash.
  const { featured, latest, showcase, trending } = await getHomeData();

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
      <HomeBlogSection />
      <PropertyCTASection />
      <FAQSection />
    </main>
  );
}

      
 
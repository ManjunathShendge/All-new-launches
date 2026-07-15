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


export default async function HomeSection() {
  const [featured, latest] = await Promise.all([
    propertyApi.getFeaturedProperties(4),
    propertyApi.getLatestProperties(8),
  ]);

  return (
    <main>
      <HeroSection />
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

      
 
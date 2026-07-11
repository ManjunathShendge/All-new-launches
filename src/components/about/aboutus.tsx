import AboutUsHero from "./AboutHero";
import AboutStatsSection from "./Numbercounts";
import MissionVisionPremium from "./Mission";
import PremiumTeamSection from "./team";
import ScalableWallOfLove from "../home/testimonial";
import TimelineCard from "../services/HowItWorks";
import GentleCollaborationCTA from "./AboutCta";
import FAQSection from "../home/faq";
import DefaultDemo from "./ParallaxEffect";


export default function Aboutfunc() {
  return (
    <main>
    <AboutUsHero />
    <AboutStatsSection />
    <DefaultDemo />
    <MissionVisionPremium />
    <PremiumTeamSection />
    <TimelineCard />
    <ScalableWallOfLove />
    <GentleCollaborationCTA />
    <FAQSection />
    </main>
  );    
}

      
 
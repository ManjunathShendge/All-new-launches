import AboutUsHero from "./AboutHero";
import AboutStatsSection from "./Numbercounts";
import MissionVisionPremium from "./Mission";
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
    <TimelineCard />
    <GentleCollaborationCTA />
    <FAQSection />
    </main>
  );    
}

      
 
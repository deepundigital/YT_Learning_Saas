import Navbar from "../components/layout/Navbar";
import FloatingOrbs from "../components/landing/FloatingOrbs";
import HeroSection from "../components/landing/HeroSection";
import StatsStrip from "../components/landing/StatsStrip";
import AnimatedCounters from "../components/landing/AnimatedCounters";
import FeatureGrid from "../components/landing/FeatureGrid";
import MarqueeStrip from "../components/landing/MarqueeStrip";
import StackedShowcase from "../components/landing/StackedShowcase";
import ProductShowcase from "../components/landing/ProductShowcase";
import FinalCtaSection from "../components/landing/FinalCtaSection";

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <FloatingOrbs />
      <Navbar />

      <div className="grid-bg relative z-10">
        <HeroSection />
        <MarqueeStrip />
        <StatsStrip />
        <AnimatedCounters />
        <FeatureGrid />
        <StackedShowcase />
        <ProductShowcase />
        <FinalCtaSection />
      </div>
    </div>
  );
}
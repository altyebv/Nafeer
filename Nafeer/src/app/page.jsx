import Navbar from '@/components/landing/Navbar';
import Hero from '@/components/landing/Hero';
import Features from '@/components/landing/Features';
import ProgressBoard from '@/components/landing/ProgressBoard';
import NafeerSection from '@/components/landing/NafeerSection';
import Footer from '@/components/landing/Footer';
import  ContributorSection  from '@/components/landing/ContributorsHallSection'
import Problemsection from '@/components/landing/Problemsection';
import Visionsection from '@/components/landing/Visionsection';
import Futuresection from '@/components/landing/Futuresection';
import FinalCTA from '@/components/landing/Finalcta';
import DemoSection from '@/components/demo/DemoSection';

export default function HomePage() {
  return (
    <div className="grain">
      <Navbar />
      <Hero />
      <Problemsection />
      <Visionsection />
      <Features />
      {/* temporarly placed here so user can have contextt */}
      <DemoSection />
      <div id="progress">
        <ProgressBoard />
      </div>
      <div id="nafeer">
        <NafeerSection />
      </div>
      <ContributorSection />
      <Futuresection />
      <FinalCTA />
      <Footer />
    </div>
  );
}

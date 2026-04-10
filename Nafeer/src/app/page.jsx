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
import VisitTracker from '@/components/VisitTracker';

export default function HomePage() {
  return (
    <div className="grain">
      <VisitTracker />
      <Navbar />
      <Hero />
      <Problemsection />
      <Visionsection />
      <Features />
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

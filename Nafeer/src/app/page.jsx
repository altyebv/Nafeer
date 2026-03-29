import Navbar from '@/components/landing/Navbar';
import Hero from '@/components/landing/Hero';
import Features from '@/components/landing/Features';
import ProgressBoard from '@/components/landing/ProgressBoard';
import NafeerSection from '@/components/landing/NafeerSection';
import Footer from '@/components/landing/Footer';
import  ContributorSection  from '@/components/landing/ContributorsHallSection'
import Problem from '@/components/landing/ProblemSection';
import Vision from '@/components/landing/VisionSection';
import Future from '@/components/landing/FutureSection';
import FinalCTA from '@/components/landing/Finalcta';

export default function HomePage() {
  return (
    <div className="grain">
      <Navbar />
      <Hero />
      <Problem />
      <Vision />
      <Features />
      <div id="progress">
        <ProgressBoard />
      </div>
      <div id="nafeer">
        <NafeerSection />
      </div>
      <ContributorSection />
      <Future />
      <FinalCTA />
      <Footer />
    </div>
  );
}

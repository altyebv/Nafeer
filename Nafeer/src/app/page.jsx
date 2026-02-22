import Navbar from '@/components/landing/Navbar';
import Hero from '@/components/landing/Hero';
import Features from '@/components/landing/Features';
import ProgressBoard from '@/components/landing/ProgressBoard';
import NafeerSection from '@/components/landing/NafeerSection';
import Footer from '@/components/landing/Footer';

export default function HomePage() {
  return (
    <div className="grain">
      <Navbar />
      <Hero />
      <Features />
      <div id="progress">
        <ProgressBoard />
      </div>
      <div id="nafeer">
        <NafeerSection />
      </div>
      <Footer />
    </div>
  );
}

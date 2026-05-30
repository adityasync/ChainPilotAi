import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/landing/Navbar';
import Hero from '../components/landing/Hero';
import TrustBar from '../components/landing/TrustBar';
import FeatureDeepDive from '../components/landing/FeatureDeepDive';
import DashboardPreview from '../components/landing/DashboardPreview';
import AIChatDemo from '../components/landing/AIChatDemo';
import Features from '../components/landing/Features';
import HowItWorks from '../components/landing/HowItWorks';
import UseCases from '../components/landing/UseCases';
import Stats from '../components/landing/Stats';
import FAQ from '../components/landing/FAQ';
import CTA from '../components/landing/CTA';
import Footer from '../components/landing/Footer';

const LandingPage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  if (isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-[#fbfbfd] dark:bg-black text-[#1d1d1f] dark:text-white">
      <Navbar />
      <Hero />
      <TrustBar />
      <FeatureDeepDive />
      <DashboardPreview />
      <AIChatDemo />
      <Features />
      <HowItWorks />
      <UseCases />
      <Stats />
      <FAQ />
      <CTA />
      <Footer />
    </div>
  );
};

export default LandingPage;

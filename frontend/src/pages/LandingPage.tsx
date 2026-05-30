import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/landing/Navbar';
import Hero from '../components/landing/Hero';
import FeatureHighlights from '../components/landing/FeatureHighlights';
import Stats from '../components/landing/Stats';
import DashboardPreview from '../components/landing/DashboardPreview';
import AIChatDemo from '../components/landing/AIChatDemo';
import HowItWorks from '../components/landing/HowItWorks';
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
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      <Hero />
      <FeatureHighlights />
      <Stats />
      <DashboardPreview />
      <AIChatDemo />
      <HowItWorks />
      <FAQ />
      <CTA />
      <Footer />
    </div>
  );
};

export default LandingPage;

import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/landing/Navbar';
import Footer from '../components/landing/Footer';
import { Home, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NotFoundPage = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const goHome = () => {
    navigate(isAuthenticated ? '/dashboard' : '/', { replace: true });
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      <section
        ref={ref}
        className="relative min-h-[80vh] flex flex-col items-center justify-center overflow-hidden bg-black px-6 pt-32 pb-20"
      >
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[1000px] h-[700px] bg-[radial-gradient(ellipse_at_center,rgba(255,69,58,0.10)_0%,transparent_70%)]" />
        </div>
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '80px 80px',
          }}
        />

        <div className="relative max-w-[720px] mx-auto text-center">
          <p
            className={`text-[12px] font-medium tracking-[0.2em] uppercase text-[#ff453a] mb-6 transition-all duration-700 ease-out ${
              visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            Error 404
          </p>
          <h1
            className={`text-[clamp(64px,14vw,160px)] font-bold tracking-[-0.04em] leading-[0.95] mb-6 transition-all duration-700 ease-out delay-100 ${
              visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <span className="bg-gradient-to-r from-[#0a84ff] via-[#5e5ce6] to-[#bf5af2] bg-clip-text text-transparent">
              Lost
            </span>
            <span className="text-white">.</span>
          </h1>
          <p
            className={`text-[clamp(17px,2vw,21px)] text-white/40 font-light max-w-[480px] mx-auto mb-10 transition-all duration-700 ease-out delay-200 ${
              visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
          >
            The page you are looking for does not exist. It may have moved,
            or the link is stale.
          </p>
          <div
            className={`flex flex-col sm:flex-row items-center justify-center gap-4 transition-all duration-700 ease-out delay-300 ${
              visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
          >
            <button
              type="button"
              onClick={goHome}
              className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full bg-white text-black text-[15px] font-medium hover:bg-white/90 transition-all duration-300 active:scale-[0.97]"
            >
              <Home className="w-4 h-4" />
              {isAuthenticated ? 'Back to dashboard' : 'Go home'}
            </button>
            <Link
              to="/faq"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full border border-white/[0.12] bg-white/[0.04] text-white text-[15px] font-medium hover:bg-white/[0.08] hover:border-white/[0.2] transition-all duration-300"
            >
              <Search className="w-4 h-4" />
              Visit the help center
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default NotFoundPage;

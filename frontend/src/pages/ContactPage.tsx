import { useEffect, useRef, useState } from 'react';
import Navbar from '../components/landing/Navbar';
import Footer from '../components/landing/Footer';
import { Mail, Send, ShieldCheck, Sparkles, MessageCircle, Briefcase, AlertTriangle } from 'lucide-react';

const channels = [
  {
    icon: MessageCircle,
    color: '#0a84ff',
    title: 'Product support',
    desc: 'Help using ChainPilot, debugging a workflow, or interpreting a forecast.',
    email: 'adityabuilds@outlook.com',
    subject: 'ChainPilot%20Support',
  },
  {
    icon: Briefcase,
    color: '#5e5ce6',
    title: 'Sales & partnerships',
    desc: 'Team plan, custom ML retraining, data residency, or anything else commercial.',
    email: 'adityabuilds@outlook.com',
    subject: 'ChainPilot%20Sales',
  },
  {
    icon: ShieldCheck,
    color: '#30d158',
    title: 'Security',
    desc: 'Vulnerability disclosure, security questionnaire, or compliance question.',
    email: 'adityabuilds@outlook.com',
    subject: 'ChainPilot%20Security%20Report',
  },
];

const ContactPage = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const [heroVisible, setHeroVisible] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [topic, setTopic] = useState('Support');
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setHeroVisible(true);
      },
      { threshold: 0.1 }
    );
    if (heroRef.current) observer.observe(heroRef.current);
    return () => observer.disconnect();
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText('adityabuilds@outlook.com');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // noop
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const subject = `ChainPilot ${topic} — from ${name || 'Anonymous'}`;
    const body = `From: ${name}\nEmail: ${email}\nTopic: ${topic}\n\n${message}`;
    const href = `mailto:adityabuilds@outlook.com?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
    window.location.href = href;
  };

  const canSubmit = name.trim() && email.trim() && message.trim();

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      {/* Hero */}
      <section
        ref={heroRef}
        className="relative pt-40 pb-16 px-6 overflow-hidden bg-black"
      >
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[1000px] h-[700px] bg-[radial-gradient(ellipse_at_center,rgba(48,209,88,0.10)_0%,transparent_70%)]" />
        </div>
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '80px 80px',
          }}
        />

        <div className="relative max-w-[860px] mx-auto text-center">
          <span
            className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] text-[11px] font-medium text-white/50 tracking-wide mb-8 transition-all duration-700 ease-out ${
              heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            Contact
          </span>
          <h1
            className={`text-[clamp(40px,7vw,72px)] font-bold tracking-[-0.04em] text-white leading-[1.05] mb-5 transition-all duration-700 ease-out delay-100 ${
              heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            Let&apos;s{' '}
            <span className="bg-gradient-to-r from-[#0a84ff] via-[#5e5ce6] to-[#bf5af2] bg-clip-text text-transparent">
              talk.
            </span>
          </h1>
          <p
            className={`text-[clamp(17px,2vw,21px)] text-white/40 font-light max-w-[520px] mx-auto transition-all duration-700 ease-out delay-200 ${
              heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
          >
            We read every message. Expect a reply within two business days.
          </p>
        </div>
      </section>

      {/* Channels */}
      <section className="px-6 pb-16">
        <div className="max-w-[1100px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-5">
          {channels.map((c) => (
            <div
              key={c.title}
              className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-7 hover:bg-white/[0.03] transition-colors duration-300"
            >
              <div
                className="inline-flex items-center justify-center w-11 h-11 rounded-xl mb-5"
                style={{
                  backgroundColor: `${c.color}15`,
                  border: `1px solid ${c.color}30`,
                }}
              >
                <c.icon className="w-5 h-5" style={{ color: c.color }} />
              </div>
              <h3 className="text-[15px] font-semibold text-white mb-2 tracking-[-0.01em]">
                {c.title}
              </h3>
              <p className="text-[13px] leading-[1.6] text-white/50 font-light mb-5">
                {c.desc}
              </p>
              <a
                href={`mailto:${c.email}?subject=${c.subject}`}
                className="inline-flex items-center gap-2 text-[13px] text-[#0a84ff] hover:text-[#5e9bff] transition-colors"
              >
                <Mail className="w-3.5 h-3.5" />
                {c.email}
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* Form */}
      <section className="px-6 pb-16">
        <div className="max-w-[680px] mx-auto">
          <div className="rounded-[24px] border border-white/[0.06] bg-white/[0.02] p-8 md:p-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-[#0a84ff]/15 border border-[#0a84ff]/30">
                <Sparkles className="w-4 h-4 text-[#0a84ff]" />
              </div>
              <div>
                <h2 className="text-[18px] font-semibold text-white tracking-[-0.01em]">
                  Send us a message
                </h2>
                <p className="text-[12px] text-white/40 font-light">
                  Opens your email client — we do not collect data on this page.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field
                  label="Your name"
                  value={name}
                  onChange={setName}
                  placeholder="Ada Lovelace"
                />
                <Field
                  label="Email"
                  type="email"
                  value={email}
                  onChange={setEmail}
                  placeholder="you@company.com"
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-white/50 mb-2">
                  Topic
                </label>
                <select
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[14px] text-white focus:outline-none focus:border-white/[0.2] focus:bg-white/[0.06] transition-all"
                >
                  <option className="bg-[#1c1c1e]">Support</option>
                  <option className="bg-[#1c1c1e]">Sales</option>
                  <option className="bg-[#1c1c1e]">Security</option>
                  <option className="bg-[#1c1c1e]">Partnership</option>
                  <option className="bg-[#1c1c1e]">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-[12px] font-medium text-white/50 mb-2">
                  Message
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                  placeholder="Tell us what is on your mind…"
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[14px] text-white placeholder:text-white/30 focus:outline-none focus:border-white/[0.2] focus:bg-white/[0.06] transition-all resize-none"
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="text-[12px] text-white/40 hover:text-white/70 transition-colors flex items-center justify-center sm:justify-start gap-1.5"
                >
                  <Mail className="w-3.5 h-3.5" />
                  {copied ? 'Copied!' : 'Copy email address'}
                </button>
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-white text-black text-[14px] font-medium hover:bg-white/90 active:scale-[0.97] transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Send className="w-3.5 h-3.5" />
                  Send message
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Response SLA */}
      <section className="px-6 pb-32">
        <div className="max-w-[680px] mx-auto rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 flex items-start gap-4">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-[#ff9f0a]/15 border border-[#ff9f0a]/30 flex-shrink-0">
            <AlertTriangle className="w-4 h-4 text-[#ff9f0a]" />
          </div>
          <div>
            <h3 className="text-[14px] font-semibold text-white mb-1">
              Found a security issue?
            </h3>
            <p className="text-[13px] leading-[1.6] text-white/50 font-light">
              Please do not post it publicly. Email{' '}
              <a
                href="mailto:adityabuilds@outlook.com?subject=ChainPilot%20Security%20Report"
                className="text-[#0a84ff] hover:text-[#5e9bff] transition-colors"
              >
                adityabuilds@outlook.com
              </a>{' '}
              with a description and steps to reproduce. We respond to all
              security reports within 24 hours.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

const Field = ({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) => (
  <div>
    <label className="block text-[12px] font-medium text-white/50 mb-2">
      {label}
    </label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[14px] text-white placeholder:text-white/30 focus:outline-none focus:border-white/[0.2] focus:bg-white/[0.06] transition-all"
    />
  </div>
);

export default ContactPage;

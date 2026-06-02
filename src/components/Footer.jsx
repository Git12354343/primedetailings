import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Clock, Search, Users, Calendar, ChevronRight } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import { ACTIVE_SOCIALS } from '../config/social';

const Footer = () => {
  const { t } = useTranslation();

  const services = Array.isArray(t('footer.serviceList')) ? t('footer.serviceList') : [];

  const QUICK_LINKS = [
    { label: t('footer.bookAppt'),   to: '/booking',       icon: Calendar },
    { label: t('nav.services'),      to: '/services',      icon: null },
    { label: t('nav.howItWorks'),    to: '/how-it-works',  icon: null },
    { label: t('faq.title'),         to: '/how-it-works#faq', icon: null },
    { label: t('nav.contact'),       to: '/contact',       icon: null },
    { label: t('footer.track'),      to: '/lookup',        icon: Search },
  ];

  return (
    <footer className="relative overflow-hidden" style={{ background: '#080b14' }}>
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(0,168,204,0.5), transparent)' }} />

      {/* Pre-footer CTA band */}
      <div className="relative py-12 px-4 sm:px-6 text-center" style={{ background: 'rgba(0,168,204,0.05)', borderBottom: '1px solid rgba(0,168,204,0.1)' }}>
        <h3 className="text-2xl sm:text-3xl font-black text-white mb-3">
          {t('footer.ctaTitle')}{' '}
          <span style={{ background: 'linear-gradient(135deg, #00a8cc, #00d4ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            {t('footer.ctaTitleAccent')}
          </span>
        </h3>
        <p className="text-gray-400 text-sm mb-6 max-w-md mx-auto">{t('footer.ctaSubtitle')}</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/booking" className="btn-luxury inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl text-sm font-bold tracking-wide group">
            {t('footer.bookAppt')}
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <a href="tel:+14387968001" className="btn-ghost-luxury inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl text-sm font-semibold">
            <Phone className="w-4 h-4" /> (438) 796-8001
          </a>
        </div>
      </div>

      {/* Main grid */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">

          {/* Brand */}
          <div className="col-span-2 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #00a8cc, #00d4ff)' }}>
                <span className="text-black font-black text-sm">PP</span>
              </div>
              <div>
                <span className="text-white font-bold text-base">Prestige Plus</span>
                <span className="font-bold text-base ml-1" style={{ background: 'linear-gradient(135deg, #00a8cc, #00d4ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  Services
                </span>
              </div>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed mb-5">{t('footer.tagline')}</p>
            {ACTIVE_SOCIALS.length > 0 && (
              <div className="flex gap-2">
                {ACTIVE_SOCIALS.map(({ icon: Icon, href, label }) => (
                  <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label}
                    className="w-11 h-11 rounded-lg flex items-center justify-center transition-all duration-200 hover:-translate-y-0.5"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <Icon className="w-4 h-4 text-gray-400" />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Services */}
          <div>
            <h4 className="text-white text-xs font-bold uppercase tracking-widest mb-4">{t('footer.servicesTitle')}</h4>
            <ul className="space-y-2.5">
              {services.map(s => (
                <li key={s}>
                  <Link to="/services" className="text-gray-500 text-sm hover:text-cyan-400 transition-colors duration-200">{s}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white text-xs font-bold uppercase tracking-widest mb-4">{t('nav.contact')}</h4>
            <ul className="space-y-3">
              {[
                { icon: Phone, content: <a href="tel:+14387968001" className="hover:text-cyan-400 transition-colors">(438) 796-8001</a> },
                { icon: Mail,  content: <a href="mailto:info@prestigeplus.services" className="hover:text-cyan-400 transition-colors">info@prestigeplus.services</a> },
                { icon: MapPin, content: <span>{t('footer.area')}</span> },
                { icon: Clock,  content: <span>{t('footer.hoursWeek')}<br /><span className="text-gray-600">{t('footer.hoursSun')}</span></span> },
              ].map(({ icon: Icon, content }, i) => (
                <li key={i} className="flex items-start gap-2 text-gray-500 text-sm">
                  <Icon className="w-4 h-4 text-cyan-500 flex-shrink-0 mt-0.5" />
                  <span>{content}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links + portals */}
          <div>
            <h4 className="text-white text-xs font-bold uppercase tracking-widest mb-4">{t('footer.quickTitle')}</h4>
            <ul className="space-y-2.5 mb-5">
              {QUICK_LINKS.map(({ label, to, icon: Icon }) => (
                <li key={to}>
                  <Link to={to} className="flex items-center gap-1.5 text-gray-500 text-sm hover:text-cyan-400 transition-colors duration-200">
                    {Icon && <Icon className="w-3.5 h-3.5" />}{label}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="flex items-center gap-2 mb-1.5">
                <Users className="w-3.5 h-3.5 text-gray-500" />
                <span className="text-gray-400 text-xs font-semibold">{t('footer.staffTitle')}</span>
              </div>
              <p className="text-gray-600 text-xs mb-3 leading-relaxed">{t('footer.staffDesc')}</p>
              <Link to="/detailer-login" className="block w-full text-center py-2 rounded-lg text-xs font-bold tracking-wide transition-all"
                style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.1)' }}>
                {t('nav.staff')}
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom bar with socials */}
        <div className="flex flex-col sm:flex-row items-center justify-between pt-6 gap-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <span className="text-gray-600 text-xs text-center sm:text-left">
            © {new Date().getFullYear()} Prestige Plus Services Montreal. {t('footer.rights')}
          </span>
          <div className="flex items-center gap-4">
            {ACTIVE_SOCIALS.length > 0 && (
              <div className="flex gap-2">
                {ACTIVE_SOCIALS.map(({ icon: Icon, href, label }) => (
                  <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label}
                    className="w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:-translate-y-0.5"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <Icon className="w-4 h-4 text-gray-500" />
                  </a>
                ))}
              </div>
            )}
            <div className="flex gap-4 text-xs text-gray-600">
              <Link to="/how-it-works#faq" className="hover:text-gray-400 transition-colors">{t('faq.title')}</Link>
              <Link to="/lookup" className="hover:text-gray-400 transition-colors">{t('footer.track')}</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

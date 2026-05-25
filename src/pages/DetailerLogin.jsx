// src/pages/DetailerLogin.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

const DetailerLogin = () => {
  const [formData, setFormData]     = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading]   = useState(false);
  const [error, setError]           = useState('');
  const [mounted, setMounted]       = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem('detailerToken');
    if (token) navigate('/detailer-dashboard');
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (data.success) {
        localStorage.setItem('detailerToken', data.token);
        localStorage.setItem('detailerRefreshToken', data.refreshToken);
        localStorage.setItem('detailerInfo', JSON.stringify(data.detailer));
        navigate('/detailer-dashboard');
      } else {
        setError(data.message || 'Login failed');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Inter:wght@300;400;500;600&display=swap');

        .dl-root {
          min-height: 100vh;
          background: #080808;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
          font-family: 'Inter', sans-serif;
          position: relative;
          overflow: hidden;
        }

        /* Ambient background glow */
        .dl-root::before {
          content: '';
          position: absolute;
          top: -20%;
          left: 50%;
          transform: translateX(-50%);
          width: 600px;
          height: 600px;
          background: radial-gradient(ellipse, rgba(201,168,76,0.07) 0%, transparent 70%);
          pointer-events: none;
        }

        /* Subtle grid texture */
        .dl-root::after {
          content: '';
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(201,168,76,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(201,168,76,0.03) 1px, transparent 1px);
          background-size: 60px 60px;
          pointer-events: none;
        }

        .dl-card {
          width: 100%;
          max-width: 420px;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(201,168,76,0.15);
          border-radius: 24px;
          padding: 48px 40px;
          position: relative;
          z-index: 1;
          backdrop-filter: blur(20px);
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 0.6s ease, transform 0.6s ease;
        }
        .dl-card.visible {
          opacity: 1;
          transform: translateY(0);
        }

        /* Gold top border accent */
        .dl-card::before {
          content: '';
          position: absolute;
          top: 0; left: 10%; right: 10%;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(201,168,76,0.6), transparent);
        }

        .dl-logo {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 40px;
        }

        .dl-logo-icon {
          width: 56px;
          height: 56px;
          border-radius: 16px;
          background: linear-gradient(135deg, #c9a84c, #f5d376);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
          box-shadow: 0 0 30px rgba(201,168,76,0.25);
        }

        .dl-logo-icon svg {
          width: 28px;
          height: 28px;
        }

        .dl-title {
          font-family: 'Cinzel', serif;
          font-size: 22px;
          font-weight: 600;
          color: #fff;
          letter-spacing: 0.05em;
          margin: 0 0 4px;
        }

        .dl-subtitle {
          font-size: 13px;
          color: rgba(255,255,255,0.3);
          letter-spacing: 0.08em;
          text-transform: uppercase;
          font-weight: 500;
        }

        .dl-error {
          background: rgba(239,68,68,0.08);
          border: 1px solid rgba(239,68,68,0.2);
          border-radius: 10px;
          padding: 12px 14px;
          margin-bottom: 20px;
          font-size: 13px;
          color: #f87171;
        }

        .dl-field {
          margin-bottom: 16px;
        }

        .dl-label {
          display: block;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(201,168,76,0.7);
          margin-bottom: 8px;
        }

        .dl-input-wrap {
          position: relative;
        }

        .dl-input {
          width: 100%;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          color: #fff;
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          padding: 13px 16px;
          outline: none;
          transition: border-color 0.2s, background 0.2s;
          box-sizing: border-box;
        }

        .dl-input:focus {
          border-color: rgba(201,168,76,0.5);
          background: rgba(255,255,255,0.06);
        }

        .dl-input::placeholder { color: rgba(255,255,255,0.2); }

        .dl-input.has-toggle { padding-right: 44px; }

        .dl-toggle {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: rgba(255,255,255,0.3);
          padding: 0;
          display: flex;
          align-items: center;
          transition: color 0.2s;
        }
        .dl-toggle:hover { color: rgba(255,255,255,0.6); }

        .dl-submit {
          width: 100%;
          margin-top: 24px;
          padding: 14px;
          border-radius: 12px;
          border: none;
          background: linear-gradient(135deg, #c9a84c, #f5d376);
          color: #000;
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          font-weight: 700;
          letter-spacing: 0.04em;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: opacity 0.2s, transform 0.15s;
          box-shadow: 0 4px 20px rgba(201,168,76,0.2);
        }
        .dl-submit:hover:not(:disabled) {
          opacity: 0.9;
          transform: translateY(-1px);
          box-shadow: 0 6px 28px rgba(201,168,76,0.3);
        }
        .dl-submit:disabled { opacity: 0.5; cursor: not-allowed; }

        .dl-back {
          display: block;
          text-align: center;
          margin-top: 24px;
          font-size: 13px;
          color: rgba(255,255,255,0.25);
          text-decoration: none;
          transition: color 0.2s;
          background: none;
          border: none;
          cursor: pointer;
          width: 100%;
          font-family: 'Inter', sans-serif;
        }
        .dl-back:hover { color: rgba(255,255,255,0.5); }

        .dl-divider {
          height: 1px;
          background: rgba(255,255,255,0.05);
          margin: 28px 0 0;
        }
      `}</style>

      <div className="dl-root">
        <div className={`dl-card ${mounted ? 'visible' : ''}`}>

          {/* Logo */}
          <div className="dl-logo">
            <div className="dl-logo-icon">
              {/* Car/detailing icon */}
              <svg viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 17l2.5-6.5A2 2 0 018.36 9h11.28a2 2 0 011.86 1.5L24 17" stroke="#000" strokeWidth="1.8" strokeLinecap="round"/>
                <rect x="3" y="17" width="22" height="5" rx="2" fill="#000" opacity="0.15"/>
                <path d="M3 17h22v3a2 2 0 01-2 2H5a2 2 0 01-2-2v-3z" stroke="#000" strokeWidth="1.8"/>
                <circle cx="8" cy="22" r="2" fill="#000"/>
                <circle cx="20" cy="22" r="2" fill="#000"/>
                <path d="M10 13h8" stroke="#000" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <h1 className="dl-title">Prestige Plus Detailing</h1>
            <p className="dl-subtitle">Detailer Portal</p>
          </div>

          {/* Error */}
          {error && <div className="dl-error">{error}</div>}

          {/* Form */}
          <div className="dl-field">
            <label className="dl-label">Email Address</label>
            <div className="dl-input-wrap">
              <input
                className="dl-input"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                placeholder="you@Prestigeplusdetailing.ca"
                autoComplete="email"
              />
            </div>
          </div>

          <div className="dl-field">
            <label className="dl-label">Password</label>
            <div className="dl-input-wrap">
              <input
                className={`dl-input has-toggle`}
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                placeholder="••••••••"
                autoComplete="current-password"
              />
              <button className="dl-toggle" type="button" onClick={() => setShowPassword(s => !s)}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button className="dl-submit" onClick={handleSubmit} disabled={isLoading}>
            {isLoading
              ? <><Loader2 size={16} className="animate-spin" /> Signing in...</>
              : 'Sign In to Dashboard'}
          </button>

          <div className="dl-divider" />
          <button className="dl-back" onClick={() => navigate('/')}>← Back to Website</button>
        </div>
      </div>
    </>
  );
};

export default DetailerLogin;

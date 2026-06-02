// Single source of truth for social media links.
// ⚠️ REPLACE the '#' placeholders below with your real profile URLs.
// Anything left as '#' is automatically hidden from the UI, so it's safe to
// ship with placeholders — empty links simply won't render.
import { Instagram, Facebook } from 'lucide-react';

export const SOCIAL_LINKS = [
  { id: 'instagram', icon: Instagram, label: 'Instagram', href: '#' }, // e.g. 'https://instagram.com/prestigeplus.services'
  { id: 'facebook',  icon: Facebook,  label: 'Facebook',  href: '#' }, // e.g. 'https://facebook.com/prestigeplus.services'
  // Add more here (TikTok, Google reviews, etc.) — they'll appear automatically.
];

// Only links with a real (non-'#') href are shown.
export const ACTIVE_SOCIALS = SOCIAL_LINKS.filter(s => s.href && s.href !== '#');

// src/components/Seo.jsx
// Per-route SEO: localized title/description, correct canonical, OG/Twitter
// tags, html lang that follows the language toggle, and optional JSON-LD.
// The static tags in index.html remain as crawler-default fallbacks; this
// component overrides them per route at runtime.

import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from '../hooks/useTranslation';

const SITE = 'https://prestigeplus.services';

const Seo = ({ page, path = '/', jsonLd }) => {
  const { t, lang } = useTranslation();
  const title       = t(`seo.${page}.title`);
  const description = t(`seo.${page}.description`);
  const url         = `${SITE}${path}`;

  return (
    <Helmet>
      <html lang={lang} />
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />

      <meta property="og:title"       content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url"         content={url} />
      <meta property="og:type"        content="website" />
      <meta property="og:image"       content={`${SITE}/og-image.jpg`} />
      <meta property="og:locale"      content={lang === 'fr' ? 'fr_CA' : 'en_CA'} />

      <meta name="twitter:card"        content="summary_large_image" />
      <meta name="twitter:title"       content={title} />
      <meta name="twitter:description" content={description} />

      {jsonLd && (
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      )}
    </Helmet>
  );
};

export default Seo;

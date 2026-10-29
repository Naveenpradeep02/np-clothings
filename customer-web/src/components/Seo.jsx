import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const PRODUCTION_DOMAIN = 'https://npclothings.com';
const DEFAULT_TITLE = 'NP Clothings — Quiet Luxury Menswear & Bespoke Shirts';
const DEFAULT_DESC = 'NP Clothings — Handcrafted quiet luxury menswear. Signature Chinese and mandarin collar shirts tailored in pure European linen and Egyptian Giza cotton.';
const DEFAULT_OG_IMAGE = `${PRODUCTION_DOMAIN}/favicon.svg`;

function upsertMeta(attr, key, content) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.content = content;
}

function upsertLink(rel, href) {
  let el = document.head.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.rel = rel;
    document.head.appendChild(el);
  }
  el.href = href;
}

/**
 * Enterprise SEO & Structured Data Manager
 * Handles dynamic title, meta descriptions, canonical URLs, OG, Twitter, and JSON-LD schemas.
 */
export default function Seo({
  title,
  description,
  canonical,
  image,
  type = 'website',
  noindex = false,
  jsonLd,
}) {
  const location = useLocation();

  useEffect(() => {
    const fullTitle = title
      ? (title.includes('NP Clothings') ? title : `${title} | NP Clothings`)
      : DEFAULT_TITLE;
    const desc = description || DEFAULT_DESC;
    const currentCanonical = canonical || `${PRODUCTION_DOMAIN}${location.pathname === '/' ? '' : location.pathname}`;
    const ogImage = image || DEFAULT_OG_IMAGE;

    document.title = fullTitle;

    // Core Metadata
    upsertMeta('name', 'description', desc);
    upsertMeta('name', 'robots', noindex ? 'noindex,nofollow' : 'index,follow,max-image-preview:large');
    upsertLink('canonical', currentCanonical);

    // OpenGraph
    upsertMeta('property', 'og:site_name', 'NP Clothings');
    upsertMeta('property', 'og:title', fullTitle);
    upsertMeta('property', 'og:description', desc);
    upsertMeta('property', 'og:type', type);
    upsertMeta('property', 'og:url', currentCanonical);
    upsertMeta('property', 'og:image', ogImage);

    // Twitter / X
    upsertMeta('name', 'twitter:card', image ? 'summary_large_image' : 'summary');
    upsertMeta('name', 'twitter:title', fullTitle);
    upsertMeta('name', 'twitter:description', desc);
    upsertMeta('name', 'twitter:image', ogImage);

    // Base Organization & WebSite JSON-LD
    const baseSchemas = [
      {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'NP Clothings',
        url: PRODUCTION_DOMAIN,
        logo: `${PRODUCTION_DOMAIN}/favicon.svg`,
        description: DEFAULT_DESC,
        telephone: '+918870686660',
        email: 'concierge@npclothings.com',
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Tirupur',
          addressRegion: 'Tamil Nadu',
          addressCountry: 'IN',
        },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'NP Clothings',
        url: PRODUCTION_DOMAIN,
        potentialAction: {
          '@type': 'SearchAction',
          target: `${PRODUCTION_DOMAIN}/shop?q={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
      },
    ];

    const scriptId = 'np-jsonld-schema';
    let script = document.getElementById(scriptId);

    const finalSchemas = jsonLd
      ? Array.isArray(jsonLd)
        ? [...baseSchemas, ...jsonLd]
        : [...baseSchemas, jsonLd]
      : baseSchemas;

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(finalSchemas);
  }, [title, description, canonical, image, type, noindex, jsonLd, location.pathname]);

  return null;
}

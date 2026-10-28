import { useEffect } from 'react';
const DEFAULT_TITLE = 'NP Clothings';
const DEFAULT_DESC = 'NP Clothings — Timeless pieces crafted from the finest materials.';
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
 * Lightweight SEO head manager for SPA routes.
 * Updates title, description, OG tags, canonical, and optional JSON-LD.
 */
export default function Seo({ title, description, canonical, image, type = 'website', noindex = false, jsonLd, }) {
    useEffect(() => {
        const fullTitle = title ? (title.includes('NP Clothings') ? title : `${title} | NP Clothings`) : DEFAULT_TITLE;
        const desc = description || DEFAULT_DESC;
        document.title = fullTitle;
        upsertMeta('name', 'description', desc);
        upsertMeta('name', 'robots', noindex ? 'noindex,nofollow' : 'index,follow');
        upsertMeta('property', 'og:title', fullTitle);
        upsertMeta('property', 'og:description', desc);
        upsertMeta('property', 'og:type', type);
        upsertMeta('property', 'og:site_name', 'NP Clothings');
        if (canonical) {
            upsertMeta('property', 'og:url', canonical);
            upsertLink('canonical', canonical);
        }
        if (image) {
            upsertMeta('property', 'og:image', image);
            upsertMeta('name', 'twitter:card', 'summary_large_image');
            upsertMeta('name', 'twitter:image', image);
        }
        else {
            upsertMeta('name', 'twitter:card', 'summary');
        }
        upsertMeta('name', 'twitter:title', fullTitle);
        upsertMeta('name', 'twitter:description', desc);
        const scriptId = 'aurea-jsonld';
        let script = document.getElementById(scriptId);
        if (jsonLd) {
            if (!script) {
                script = document.createElement('script');
                script.id = scriptId;
                script.type = 'application/ld+json';
                document.head.appendChild(script);
            }
            script.textContent = JSON.stringify(jsonLd);
        }
        else if (script) {
            script.remove();
        }
    }, [title, description, canonical, image, type, noindex, jsonLd]);
    return null;
}

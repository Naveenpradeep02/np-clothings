/**
 * SEO — robots.txt, sitemap.xml, product JSON-LD helpers.
 */

import db from '../../db/knex.js';
import config from '../../config/index.js';
import { ServiceUnavailableError, AppError } from '../../lib/errors.js';
import logger from '../../lib/logger.js';

function wrap(fn, err) {
  if (err instanceof AppError) throw err;
  logger.error(`seo.${fn} failed`, err);
  throw new ServiceUnavailableError('SEO temporarily unavailable');
}

function siteBase() {
  return (config.customerWebUrl || config.appBaseUrl || 'https://aurea.example').replace(/\/$/, '');
}

export function robotsTxt() {
  const base = siteBase();
  return [
    'User-agent: *',
    'Allow: /',
    'Disallow: /cart',
    'Disallow: /checkout',
    'Disallow: /account',
    'Disallow: /admin',
    `Sitemap: ${base}/sitemap.xml`,
    '',
  ].join('\n');
}

/**
 * Build sitemap URL entries.
 */
export async function buildSitemapUrls() {
  try {
    const base = siteBase();
    const now = new Date().toISOString().slice(0, 10);
    const urls = [
      { loc: `${base}/`, changefreq: 'daily', priority: '1.0', lastmod: now },
      { loc: `${base}/shop`, changefreq: 'daily', priority: '0.9', lastmod: now },
    ];

    const categories = await db('categories')
      .where({ status: 'active' })
      .whereNull('deleted_at')
      .select('slug', 'updated_at')
      .catch(() => []);

    for (const c of categories) {
      urls.push({
        loc: `${base}/shop?category=${encodeURIComponent(c.slug)}`,
        changefreq: 'weekly',
        priority: '0.7',
        lastmod: c.updated_at
          ? new Date(c.updated_at).toISOString().slice(0, 10)
          : now,
      });
    }

    const products = await db('products')
      .where({ status: 'published' })
      .whereNull('deleted_at')
      .select('slug', 'updated_at')
      .limit(5000)
      .catch(() => []);

    for (const p of products) {
      urls.push({
        loc: `${base}/product/${encodeURIComponent(p.slug)}`,
        changefreq: 'weekly',
        priority: '0.8',
        lastmod: p.updated_at
          ? new Date(p.updated_at).toISOString().slice(0, 10)
          : now,
      });
    }

    return urls;
  } catch (err) {
    wrap('buildSitemapUrls', err);
  }
}

export function sitemapXml(urls) {
  const body = urls
    .map(
      (u) => `  <url>
    <loc>${escapeXml(u.loc)}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`;
}

function escapeXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Product structured data (JSON-LD Product).
 */
export function productJsonLd(product, { price, currency = 'INR', inStock, image } = {}) {
  const base = siteBase();
  const data = {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name: product.seo_title || product.name,
    description: product.seo_description || product.short_description || product.description || '',
    sku: product.sku || undefined,
    url: `${base}/product/${product.slug}`,
    image: image ? [image] : undefined,
    brand: product.brand_name
      ? { '@type': 'Brand', name: product.brand_name }
      : { '@type': 'Brand', name: 'AUREA' },
  };

  if (price != null) {
    data.offers = {
      '@type': 'Offer',
      priceCurrency: currency,
      price: Number(price),
      availability: inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      url: data.url,
    };
  }

  return data;
}

/**
 * Open Graph / meta payload for a product page.
 */
export function productMeta(product, { image } = {}) {
  const base = siteBase();
  const title = product.seo_title || `${product.name} | AUREA`;
  const description =
    product.seo_description ||
    product.short_description ||
    'Timeless pieces from AUREA.';
  return {
    title,
    description,
    canonical: `${base}/product/${product.slug}`,
    keywords: product.seo_keywords || null,
    og: {
      type: 'product',
      title,
      description,
      url: `${base}/product/${product.slug}`,
      image: image || null,
      site_name: 'AUREA',
    },
  };
}

export default {
  robotsTxt,
  buildSitemapUrls,
  sitemapXml,
  productJsonLd,
  productMeta,
  siteBase,
};

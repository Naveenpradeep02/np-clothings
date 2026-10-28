import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

function escapeXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function sitemapXml(urls) {
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

function productJsonLd(product, { price, inStock } = {}) {
  const data = {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name: product.seo_title || product.name,
    description: product.seo_description || product.short_description || '',
  };
  if (price != null) {
    data.offers = {
      '@type': 'Offer',
      priceCurrency: 'INR',
      price: Number(price),
      availability: inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
    };
  }
  return data;
}

function robotsTxt(base = 'https://aurea.example') {
  return [
    'User-agent: *',
    'Allow: /',
    'Disallow: /cart',
    `Sitemap: ${base}/sitemap.xml`,
  ].join('\n');
}

describe('SEO helpers', () => {
  it('escapes XML special characters', () => {
    assert.equal(escapeXml('a&b<c>'), 'a&amp;b&lt;c&gt;');
  });

  it('builds sitemap xml', () => {
    const xml = sitemapXml([
      { loc: 'https://x.com/', lastmod: '2026-10-09', changefreq: 'daily', priority: '1.0' },
    ]);
    assert.ok(xml.includes('<urlset'));
    assert.ok(xml.includes('https://x.com/'));
  });

  it('builds product json-ld with offer', () => {
    const ld = productJsonLd(
      { name: 'Linen Shirt', seo_title: null, short_description: 'Soft' },
      { price: 2999, inStock: true }
    );
    assert.equal(ld['@type'], 'Product');
    assert.equal(ld.offers.price, 2999);
    assert.ok(ld.offers.availability.includes('InStock'));
  });

  it('robots disallows cart', () => {
    const r = robotsTxt();
    assert.ok(r.includes('Disallow: /cart'));
    assert.ok(r.includes('Sitemap:'));
  });
});

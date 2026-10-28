import * as service from './service.js';

export async function robots(req, res) {
  res.type('text/plain').send(service.robotsTxt());
}

export async function sitemap(req, res) {
  const urls = await service.buildSitemapUrls();
  res.type('application/xml').send(service.sitemapXml(urls));
}

export default { robots, sitemap };

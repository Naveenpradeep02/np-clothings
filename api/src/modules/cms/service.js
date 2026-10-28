/**
 * Homepage CMS — public composition + full admin lifecycle.
 */

import * as repo from './repository.js';
import * as productsRepo from '../products/repository.js';
import { writeAudit } from '../audit/service.js';
import {
  NotFoundError,
  BadRequestError,
  ServiceUnavailableError,
  AppError,
} from '../../lib/errors.js';
import logger from '../../lib/logger.js';

const SECTION_TYPES = [
  'hero_banner',
  'promo_banner',
  'featured_products',
  'latest_products',
  'category_tiles',
  'collection',
  'product_carousel',
  'custom_text',
  'spacer',
];

function wrap(fn, err) {
  if (err instanceof AppError) throw err;
  logger.error(`cms.${fn} failed`, err);
  throw new ServiceUnavailableError('CMS temporarily unavailable');
}

function parseConfig(config) {
  if (config == null) return null;
  if (typeof config === 'object') return config;
  try {
    return JSON.parse(config);
  } catch {
    return null;
  }
}

async function enrichSection(section, { admin = false } = {}) {
  const item = {
    id: section.id,
    page: section.page,
    type: section.section_type,
    section_type: section.section_type,
    title: section.title,
    subtitle: section.subtitle,
    config: parseConfig(section.config),
    sort_order: section.sort_order,
    status: section.status,
    starts_at: section.starts_at,
    ends_at: section.ends_at,
  };

  if (['hero_banner', 'promo_banner'].includes(section.section_type)) {
    item.banners = await repo.getBanners(section.id);
  }

  if (
    ['featured_products', 'latest_products', 'product_carousel', 'collection'].includes(
      section.section_type
    )
  ) {
    const links = await repo.getSectionProductIds(section.id);
    const products = [];
    if (links.length) {
      for (const link of links) {
        const p = await productsRepo.findById(link.product_id);
        if (p && (admin || p.status === 'published')) {
          const images = await productsRepo.listImages(p.id);
          products.push({
            id: p.id,
            name: p.name,
            slug: p.slug,
            short_description: p.short_description,
            status: p.status,
            is_featured: p.is_featured,
            primary_image: images.find((i) => i.is_primary) || images[0] || null,
          });
        }
      }
    } else if (!admin && section.section_type === 'latest_products') {
      const { rows } = await productsRepo.listProducts({
        limit: 8,
        offset: 0,
        status: 'published',
      });
      for (const p of rows) {
        const images = await productsRepo.listImages(p.id);
        products.push({
          id: p.id,
          name: p.name,
          slug: p.slug,
          short_description: p.short_description,
          is_featured: p.is_featured,
          primary_image: images.find((i) => i.is_primary) || images[0] || null,
        });
      }
    } else if (!admin && section.section_type === 'featured_products') {
      const { rows } = await productsRepo.listProducts({
        limit: 8,
        offset: 0,
        status: 'published',
        featured: true,
      });
      for (const p of rows) {
        const images = await productsRepo.listImages(p.id);
        products.push({
          id: p.id,
          name: p.name,
          slug: p.slug,
          short_description: p.short_description,
          is_featured: p.is_featured,
          primary_image: images.find((i) => i.is_primary) || images[0] || null,
        });
      }
    }
    item.products = products;
  }

  return item;
}

export async function getPage(page = 'home') {
  try {
    const sections = await repo.listPublishedSections(page);
    const result = [];
    for (const section of sections) {
      result.push(await enrichSection(section));
    }
    return { page, sections: result };
  } catch (err) {
    wrap('getPage', err);
  }
}

export async function listAdmin(page = 'home') {
  try {
    const rows = await repo.listAdminSections(page);
    const out = [];
    for (const row of rows) {
      out.push(await enrichSection(row, { admin: true }));
    }
    return { page, sections: out };
  } catch (err) {
    wrap('listAdmin', err);
  }
}

export async function getSection(id) {
  try {
    const row = await repo.findSection(id);
    if (!row) throw new NotFoundError('Section not found');
    return enrichSection(row, { admin: true });
  } catch (err) {
    wrap('getSection', err);
  }
}

export async function createSection(actor, body) {
  try {
    if (!body?.section_type) throw new BadRequestError('section_type is required');
    if (!SECTION_TYPES.includes(body.section_type)) {
      throw new BadRequestError(`section_type must be one of: ${SECTION_TYPES.join(', ')}`);
    }
    if (body.status && !['draft', 'published'].includes(body.status)) {
      throw new BadRequestError('status must be draft or published');
    }

    const row = await repo.createSection({
      page: body.page || 'home',
      section_type: body.section_type,
      title: body.title ?? null,
      subtitle: body.subtitle ?? null,
      config: body.config ?? null,
      sort_order: Number(body.sort_order) || 0,
      status: body.status || 'draft',
      starts_at: body.starts_at ?? null,
      ends_at: body.ends_at ?? null,
      created_by: actor?.id,
      updated_by: actor?.id,
    });

    await writeAudit({
      actorId: actor?.id,
      action: 'cms.section_created',
      entityType: 'cms_section',
      entityId: row.id,
      newValues: { section_type: body.section_type, page: body.page || 'home' },
    });

    return enrichSection(row, { admin: true });
  } catch (err) {
    wrap('createSection', err);
  }
}

export async function updateSection(actor, id, body) {
  try {
    const current = await repo.findSection(id);
    if (!current) throw new NotFoundError('Section not found');

    if (body.section_type && !SECTION_TYPES.includes(body.section_type)) {
      throw new BadRequestError(`section_type must be one of: ${SECTION_TYPES.join(', ')}`);
    }
    if (body.status && !['draft', 'published'].includes(body.status)) {
      throw new BadRequestError('status must be draft or published');
    }

    const row = await repo.updateSection(id, { ...body, updated_by: actor?.id });
    await writeAudit({
      actorId: actor?.id,
      action: 'cms.section_updated',
      entityType: 'cms_section',
      entityId: Number(id),
      newValues: body,
    });
    return enrichSection(row, { admin: true });
  } catch (err) {
    wrap('updateSection', err);
  }
}

export async function deleteSection(actor, id) {
  try {
    const current = await repo.findSection(id);
    if (!current) throw new NotFoundError('Section not found');
    await repo.deleteSection(id);
    await writeAudit({
      actorId: actor?.id,
      action: 'cms.section_deleted',
      entityType: 'cms_section',
      entityId: Number(id),
      oldValues: { section_type: current.section_type, title: current.title },
    });
    return { id: Number(id), deleted: true };
  } catch (err) {
    wrap('deleteSection', err);
  }
}

export async function reorder(actor, page, sectionIds) {
  try {
    if (!Array.isArray(sectionIds) || !sectionIds.length) {
      throw new BadRequestError('section_ids must be a non-empty array');
    }
    await repo.reorderSections(page || 'home', sectionIds.map(Number));
    await writeAudit({
      actorId: actor?.id,
      action: 'cms.sections_reordered',
      entityType: 'cms_page',
      entityId: null,
      newValues: { page: page || 'home', section_ids: sectionIds },
    });
    return listAdmin(page || 'home');
  } catch (err) {
    wrap('reorder', err);
  }
}

export async function addBanner(actor, sectionId, body) {
  try {
    const section = await repo.findSection(sectionId);
    if (!section) throw new NotFoundError('Section not found');
    if (!body?.image_url?.trim()) throw new BadRequestError('image_url is required');
    const banner = await repo.addBanner(sectionId, {
      image_url: body.image_url.trim(),
      mobile_image_url: body.mobile_image_url ?? null,
      alt_text: body.alt_text ?? null,
      link_url: body.link_url ?? null,
      link_text: body.link_text ?? null,
      sort_order: Number(body.sort_order) || 0,
    });
    await writeAudit({
      actorId: actor?.id,
      action: 'cms.banner_added',
      entityType: 'cms_section',
      entityId: Number(sectionId),
      newValues: { banner_id: banner.id },
    });
    return banner;
  } catch (err) {
    wrap('addBanner', err);
  }
}

export async function updateBanner(actor, sectionId, bannerId, body) {
  try {
    const banner = await repo.findBanner(bannerId);
    if (!banner || Number(banner.section_id) !== Number(sectionId)) {
      throw new NotFoundError('Banner not found');
    }
    return await repo.updateBanner(bannerId, body);
  } catch (err) {
    wrap('updateBanner', err);
  }
}

export async function deleteBanner(actor, sectionId, bannerId) {
  try {
    const banner = await repo.findBanner(bannerId);
    if (!banner || Number(banner.section_id) !== Number(sectionId)) {
      throw new NotFoundError('Banner not found');
    }
    await repo.deleteBanner(bannerId);
    return { id: Number(bannerId), deleted: true };
  } catch (err) {
    wrap('deleteBanner', err);
  }
}

export async function setProducts(actor, sectionId, productIds) {
  try {
    const section = await repo.findSection(sectionId);
    if (!section) throw new NotFoundError('Section not found');
    if (!Array.isArray(productIds)) throw new BadRequestError('product_ids must be an array');
    await repo.setSectionProducts(sectionId, productIds.map(Number));
    await writeAudit({
      actorId: actor?.id,
      action: 'cms.section_products_set',
      entityType: 'cms_section',
      entityId: Number(sectionId),
      newValues: { product_ids: productIds },
    });
    return enrichSection(await repo.findSection(sectionId), { admin: true });
  } catch (err) {
    wrap('setProducts', err);
  }
}

/**
 * Seed a minimal luxury homepage if empty.
 */
export async function seedHome(actor) {
  try {
    const existing = await repo.listAdminSections('home');
    if (existing.length) {
      return { seeded: false, message: 'Home already has sections', count: existing.length };
    }

    const hero = await repo.createSection({
      page: 'home',
      section_type: 'hero_banner',
      title: 'Quiet Luxury',
      subtitle: 'Timeless pieces for the considered wardrobe',
      sort_order: 0,
      status: 'published',
      created_by: actor?.id,
      updated_by: actor?.id,
    });
    await repo.addBanner(hero.id, {
      image_url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1600',
      alt_text: 'AUREA collection',
      link_url: '/shop',
      link_text: 'Explore Collection',
      sort_order: 0,
    });

    await repo.createSection({
      page: 'home',
      section_type: 'featured_products',
      title: 'Featured',
      subtitle: 'Selected for the season',
      sort_order: 1,
      status: 'published',
      created_by: actor?.id,
      updated_by: actor?.id,
    });

    await repo.createSection({
      page: 'home',
      section_type: 'latest_products',
      title: 'New Arrivals',
      sort_order: 2,
      status: 'published',
      created_by: actor?.id,
      updated_by: actor?.id,
    });

    await repo.createSection({
      page: 'home',
      section_type: 'custom_text',
      title: 'Crafted with intention',
      subtitle:
        'Every AUREA piece is designed for longevity — refined silhouettes, honest materials, and quiet detail.',
      sort_order: 3,
      status: 'published',
      created_by: actor?.id,
      updated_by: actor?.id,
    });

    await writeAudit({
      actorId: actor?.id,
      action: 'cms.home_seeded',
      entityType: 'cms_page',
      entityId: null,
      newValues: { page: 'home' },
    });

    return listAdmin('home');
  } catch (err) {
    wrap('seedHome', err);
  }
}

export { SECTION_TYPES };

export default {
  getPage,
  listAdmin,
  getSection,
  createSection,
  updateSection,
  deleteSection,
  reorder,
  addBanner,
  updateBanner,
  deleteBanner,
  setProducts,
  seedHome,
  SECTION_TYPES,
};

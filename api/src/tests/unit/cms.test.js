import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

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

describe('CMS section types', () => {
  it('includes hero and product blocks', () => {
    assert.ok(SECTION_TYPES.includes('hero_banner'));
    assert.ok(SECTION_TYPES.includes('featured_products'));
    assert.ok(SECTION_TYPES.includes('custom_text'));
  });

  it('rejects unknown type', () => {
    assert.equal(SECTION_TYPES.includes('video_wall'), false);
  });
});

/**
 * Categories, brands, specification library, sample configurable shirt + inventory
 */
const crypto = require('crypto');

function optionHash(ids) {
  const sorted = [...ids].sort((a, b) => a - b).join('|');
  return crypto.createHash('sha256').update(sorted).digest('hex');
}

/** @param {import('knex').Knex} knex */
exports.seed = async function seed(knex) {
  // --- Categories ---
  async function ensureCategory({ name, slug, parent_id = null, sort_order = 0 }) {
    let row = await knex('categories').where({ slug }).first();
    if (!row) {
      const [id] = await knex('categories').insert({
        name,
        slug,
        parent_id,
        sort_order,
        status: 'active',
        created_at: knex.fn.now(),
        updated_at: knex.fn.now(),
      });
      row = await knex('categories').where({ id }).first();
    }
    return row;
  }

  const men = await ensureCategory({ name: 'Men', slug: 'men', sort_order: 1 });
  const women = await ensureCategory({ name: 'Women', slug: 'women', sort_order: 2 });
  const kids = await ensureCategory({ name: 'Kids', slug: 'kids', sort_order: 3 });
  const shirts = await ensureCategory({
    name: 'Shirts',
    slug: 'men-shirts',
    parent_id: men.id,
    sort_order: 1,
  });
  await ensureCategory({ name: 'Trousers', slug: 'men-trousers', parent_id: men.id, sort_order: 2 });
  await ensureCategory({ name: 'Dresses', slug: 'women-dresses', parent_id: women.id, sort_order: 1 });
  await ensureCategory({ name: 'Boys', slug: 'kids-boys', parent_id: kids.id, sort_order: 1 });
  await ensureCategory({ name: 'Girls', slug: 'kids-girls', parent_id: kids.id, sort_order: 2 });

  // --- Brands ---
  async function ensureBrand(name, slug) {
    let row = await knex('brands').where({ slug }).first();
    if (!row) {
      const [id] = await knex('brands').insert({
        name,
        slug,
        status: 'active',
        created_at: knex.fn.now(),
        updated_at: knex.fn.now(),
      });
      row = await knex('brands').where({ id }).first();
    }
    return row;
  }

  const brandAurea = await ensureBrand('AUREA', 'aurea');
  await ensureBrand('Atelier Noir', 'atelier-noir');

  // --- Specification groups & options ---
  const groupsDef = [
    {
      code: 'size',
      name: 'Size',
      sort_order: 1,
      options: [
        { code: 'xs', name: 'XS' },
        { code: 's', name: 'S' },
        { code: 'm', name: 'M' },
        { code: 'l', name: 'L' },
        { code: 'xl', name: 'XL' },
        { code: 'xxl', name: 'XXL' },
      ],
    },
    {
      code: 'color',
      name: 'Color',
      sort_order: 2,
      input_type: 'swatch',
      options: [
        { code: 'black', name: 'Black', metadata: JSON.stringify({ hex: '#000000' }) },
        { code: 'white', name: 'White', metadata: JSON.stringify({ hex: '#ffffff' }) },
        { code: 'navy', name: 'Navy', metadata: JSON.stringify({ hex: '#1a2744' }) },
        { code: 'olive', name: 'Olive', metadata: JSON.stringify({ hex: '#556b2f' }) },
      ],
    },
    {
      code: 'material',
      name: 'Material',
      sort_order: 3,
      options: [
        { code: 'pure_linen', name: 'Pure Linen' },
        { code: 'cotton', name: 'Cotton' },
        { code: 'wool_silk', name: 'Wool-Silk' },
        { code: 'cashmere', name: 'Cashmere' },
      ],
    },
    {
      code: 'collar',
      name: 'Collar',
      sort_order: 4,
      options: [
        { code: 'normal', name: 'Normal' },
        { code: 'chinese', name: 'Chinese' },
        { code: 'button_down', name: 'Button Down' },
      ],
    },
    {
      code: 'button',
      name: 'Button',
      sort_order: 5,
      options: [
        { code: 'normal', name: 'Normal' },
        { code: 'press', name: 'Press' },
        { code: 'hidden', name: 'Hidden' },
      ],
    },
    {
      code: 'placket',
      name: 'Placket',
      sort_order: 6,
      options: [
        { code: 'french_front', name: 'French Front' },
        { code: 'covered_fly', name: 'Covered Fly' },
        { code: 'front_placket', name: 'Front Placket' },
        { code: 'tuxedo_front', name: 'Tuxedo Front' },
      ],
    },
    {
      code: 'cuff',
      name: 'Cuff',
      sort_order: 7,
      options: [
        { code: 'normal', name: 'Normal' },
        { code: 'angled', name: 'Angled' },
        { code: 'rounded', name: 'Rounded' },
        { code: 'rounded_french', name: 'Rounded French' },
      ],
    },
  ];

  const optionIdByGroupCode = {};

  for (const g of groupsDef) {
    let group = await knex('specification_groups').where({ code: g.code }).first();
    if (!group) {
      const [gid] = await knex('specification_groups').insert({
        code: g.code,
        name: g.name,
        input_type: g.input_type || 'select',
        is_required: true,
        sort_order: g.sort_order,
        created_at: knex.fn.now(),
        updated_at: knex.fn.now(),
      });
      group = await knex('specification_groups').where({ id: gid }).first();
    }
    optionIdByGroupCode[g.code] = {};
    for (let i = 0; i < g.options.length; i++) {
      const opt = g.options[i];
      let row = await knex('specification_options')
        .where({ group_id: group.id, code: opt.code })
        .first();
      if (!row) {
        const [oid] = await knex('specification_options').insert({
          group_id: group.id,
          code: opt.code,
          name: opt.name,
          metadata: opt.metadata || null,
          sort_order: i,
          status: 'active',
          created_at: knex.fn.now(),
          updated_at: knex.fn.now(),
        });
        row = await knex('specification_options').where({ id: oid }).first();
      }
      optionIdByGroupCode[g.code][opt.code] = row.id;
    }
  }

  // --- Sample product ---
  const productSlug = 'black-pure-linen-shirt';
  let product = await knex('products').where({ slug: productSlug }).first();
  if (!product) {
    const [pid] = await knex('products').insert({
      category_id: shirts.id,
      brand_id: brandAurea.id,
      name: 'Black Pure Linen Shirt',
      slug: productSlug,
      description:
        'A refined pure linen shirt with configurable collar, button, placket and cuff. Crafted for quiet luxury.',
      short_description: 'Configurable pure linen shirt',
      design_pattern: 'Solid',
      base_material: 'Pure Linen',
      status: 'published',
      is_featured: true,
      published_at: knex.fn.now(),
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    });
    product = await knex('products').where({ id: pid }).first();
  }

  // Assign all spec groups to product
  const groups = await knex('specification_groups').select('id', 'code');
  for (let i = 0; i < groups.length; i++) {
    const g = groups[i];
    const exists = await knex('product_specification_groups')
      .where({ product_id: product.id, group_id: g.id })
      .first();
    if (!exists) {
      await knex('product_specification_groups').insert({
        product_id: product.id,
        group_id: g.id,
        sort_order: i,
        is_required: true,
      });
    }
  }

  // Allow all options for this product
  const allOptions = await knex('specification_options').select('id');
  for (const o of allOptions) {
    const exists = await knex('product_specification_options')
      .where({ product_id: product.id, option_id: o.id })
      .first();
    if (!exists) {
      await knex('product_specification_options').insert({
        product_id: product.id,
        option_id: o.id,
      });
    }
  }

  // Sample variants
  const variantsDef = [
    {
      sku: 'SH-BLK-LIN-M-CH-PR-FR-N',
      price: 3699,
      stock: 14,
      opts: {
        size: 'm',
        color: 'black',
        material: 'pure_linen',
        collar: 'chinese',
        button: 'press',
        placket: 'front_placket',
        cuff: 'normal',
      },
    },
    {
      sku: 'SH-BLK-LIN-L-CH-PR-FR-N',
      price: 3699,
      stock: 10,
      opts: {
        size: 'l',
        color: 'black',
        material: 'pure_linen',
        collar: 'chinese',
        button: 'press',
        placket: 'front_placket',
        cuff: 'normal',
      },
    },
    {
      sku: 'SH-WHT-LIN-M-BD-NR-FF-N',
      price: 3899,
      stock: 8,
      opts: {
        size: 'm',
        color: 'white',
        material: 'pure_linen',
        collar: 'button_down',
        button: 'normal',
        placket: 'french_front',
        cuff: 'normal',
      },
    },
    {
      sku: 'SH-NVY-LIN-S-NR-NR-FR-N',
      price: 3699,
      stock: 12,
      opts: {
        size: 's',
        color: 'navy',
        material: 'pure_linen',
        collar: 'normal',
        button: 'normal',
        placket: 'front_placket',
        cuff: 'normal',
      },
    },
    {
      sku: 'SH-BLK-LIN-XL-CH-HD-CV-RG',
      price: 3799,
      stock: 6,
      opts: {
        size: 'xl',
        color: 'black',
        material: 'pure_linen',
        collar: 'chinese',
        button: 'hidden',
        placket: 'covered_fly',
        cuff: 'rounded',
      },
    },
  ];

  for (const v of variantsDef) {
    let existing = await knex('product_variants').where({ sku: v.sku }).first();
    const optionIds = Object.entries(v.opts).map(
      ([groupCode, optCode]) => optionIdByGroupCode[groupCode][optCode]
    );
    const hash = optionHash(optionIds);

    if (!existing) {
      const [vid] = await knex('product_variants').insert({
        product_id: product.id,
        sku: v.sku,
        price: v.price,
        status: 'active',
        option_hash: hash,
        created_at: knex.fn.now(),
        updated_at: knex.fn.now(),
      });
      existing = await knex('product_variants').where({ id: vid }).first();

      for (const oid of optionIds) {
        await knex('variant_option_values').insert({
          variant_id: existing.id,
          option_id: oid,
        });
      }

      await knex('inventory').insert({
        variant_id: existing.id,
        quantity: v.stock,
        reserved_quantity: 0,
        low_stock_threshold: 5,
        updated_at: knex.fn.now(),
      });

      await knex('inventory_ledger').insert({
        variant_id: existing.id,
        change_type: 'adjustment',
        quantity_delta: v.stock,
        quantity_after: v.stock,
        reference_type: 'seed',
        reason: 'Initial stock from seed',
        created_at: knex.fn.now(),
      });
    }
  }
};

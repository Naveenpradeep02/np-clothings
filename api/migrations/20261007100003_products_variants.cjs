/**
 * Products, images, product-spec links, variants, variant options & images
 */

/** @param {import('knex').Knex} knex */
exports.up = async function up(knex) {
  await knex.schema.createTable('products', (t) => {
    t.bigIncrements('id').unsigned().primary();
    t.bigInteger('category_id').unsigned().notNullable();
    t.bigInteger('brand_id').unsigned().nullable();
    t.string('name', 255).notNullable();
    t.string('slug', 280).notNullable();
    t.text('description').nullable();
    t.string('short_description', 512).nullable();
    t.string('design_pattern', 150).nullable();
    t.string('base_material', 150).nullable();
    t.enum('status', ['draft', 'published', 'archived']).notNullable().defaultTo('draft');
    t.boolean('is_featured').notNullable().defaultTo(false);
    t.string('seo_title', 255).nullable();
    t.string('seo_description', 512).nullable();
    t.string('seo_keywords', 255).nullable();
    t.dateTime('published_at').nullable();
    t.bigInteger('created_by').unsigned().nullable();
    t.bigInteger('updated_by').unsigned().nullable();
    t.timestamps(true, true);
    t.dateTime('deleted_at').nullable();
    t.unique(['slug'], { indexName: 'uq_products_slug' });
    t.index(['category_id'], 'idx_products_category');
    t.index(['brand_id'], 'idx_products_brand');
    t.index(['status'], 'idx_products_status');
    t.index(['is_featured', 'status'], 'idx_products_featured');
    t.foreign('category_id').references('categories.id');
    t.foreign('brand_id').references('brands.id').onDelete('SET NULL');
    t.foreign('created_by').references('users.id').onDelete('SET NULL');
    t.foreign('updated_by').references('users.id').onDelete('SET NULL');
  });

  await knex.schema.createTable('product_images', (t) => {
    t.bigIncrements('id').unsigned().primary();
    t.bigInteger('product_id').unsigned().notNullable();
    t.string('url', 512).notNullable();
    t.string('alt_text', 255).nullable();
    t.integer('sort_order').notNullable().defaultTo(0);
    t.boolean('is_primary').notNullable().defaultTo(false);
    t.timestamp('created_at').defaultTo(knex.fn.now());
    t.index(['product_id', 'sort_order'], 'idx_product_images_product');
    t.foreign('product_id').references('products.id').onDelete('CASCADE');
  });

  await knex.schema.createTable('product_specification_groups', (t) => {
    t.bigInteger('product_id').unsigned().notNullable();
    t.bigInteger('group_id').unsigned().notNullable();
    t.integer('sort_order').notNullable().defaultTo(0);
    t.boolean('is_required').notNullable().defaultTo(true);
    t.primary(['product_id', 'group_id']);
    t.foreign('product_id').references('products.id').onDelete('CASCADE');
    t.foreign('group_id').references('specification_groups.id').onDelete('CASCADE');
  });

  await knex.schema.createTable('product_specification_options', (t) => {
    t.bigInteger('product_id').unsigned().notNullable();
    t.bigInteger('option_id').unsigned().notNullable();
    t.primary(['product_id', 'option_id']);
    t.foreign('product_id').references('products.id').onDelete('CASCADE');
    t.foreign('option_id').references('specification_options.id').onDelete('CASCADE');
  });

  await knex.schema.createTable('product_variants', (t) => {
    t.bigIncrements('id').unsigned().primary();
    t.bigInteger('product_id').unsigned().notNullable();
    t.string('sku', 64).notNullable();
    t.string('barcode', 64).nullable();
    t.decimal('price', 12, 2).notNullable();
    t.decimal('compare_at_price', 12, 2).nullable();
    t.decimal('cost_price', 12, 2).nullable();
    t.enum('status', ['active', 'inactive']).notNullable().defaultTo('active');
    t.integer('weight_grams').nullable();
    // SHA-256 hex of sorted option IDs — unique combination per product
    t.string('option_hash', 64).notNullable();
    t.timestamps(true, true);
    t.dateTime('deleted_at').nullable();
    t.unique(['sku'], { indexName: 'uq_variants_sku' });
    t.unique(['product_id', 'option_hash'], { indexName: 'uq_variants_product_option_hash' });
    t.index(['product_id', 'status'], 'idx_variants_product_status');
    t.foreign('product_id').references('products.id').onDelete('CASCADE');
  });

  await knex.schema.createTable('variant_option_values', (t) => {
    t.bigInteger('variant_id').unsigned().notNullable();
    t.bigInteger('option_id').unsigned().notNullable();
    t.primary(['variant_id', 'option_id']);
    t.index(['option_id'], 'idx_vov_option');
    t.foreign('variant_id').references('product_variants.id').onDelete('CASCADE');
    t.foreign('option_id').references('specification_options.id').onDelete('RESTRICT');
  });

  await knex.schema.createTable('variant_images', (t) => {
    t.bigIncrements('id').unsigned().primary();
    t.bigInteger('variant_id').unsigned().notNullable();
    t.string('url', 512).notNullable();
    t.string('alt_text', 255).nullable();
    t.integer('sort_order').notNullable().defaultTo(0);
    t.timestamp('created_at').defaultTo(knex.fn.now());
    t.index(['variant_id', 'sort_order'], 'idx_variant_images_variant');
    t.foreign('variant_id').references('product_variants.id').onDelete('CASCADE');
  });
};

/** @param {import('knex').Knex} knex */
exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists('variant_images');
  await knex.schema.dropTableIfExists('variant_option_values');
  await knex.schema.dropTableIfExists('product_variants');
  await knex.schema.dropTableIfExists('product_specification_options');
  await knex.schema.dropTableIfExists('product_specification_groups');
  await knex.schema.dropTableIfExists('product_images');
  await knex.schema.dropTableIfExists('products');
};

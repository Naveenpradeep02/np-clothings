/**
 * Categories, brands, specification groups & options
 */

/** @param {import('knex').Knex} knex */
exports.up = async function up(knex) {
  await knex.schema.createTable('categories', (t) => {
    t.bigIncrements('id').unsigned().primary();
    t.bigInteger('parent_id').unsigned().nullable();
    t.string('name', 150).notNullable();
    t.string('slug', 180).notNullable();
    t.text('description').nullable();
    t.string('image_url', 512).nullable();
    t.integer('sort_order').notNullable().defaultTo(0);
    t.enum('status', ['active', 'inactive']).notNullable().defaultTo('active');
    t.string('seo_title', 255).nullable();
    t.string('seo_description', 512).nullable();
    t.timestamps(true, true);
    t.dateTime('deleted_at').nullable();
    t.unique(['slug'], { indexName: 'uq_categories_slug' });
    t.index(['parent_id'], 'idx_categories_parent');
    t.index(['status', 'sort_order'], 'idx_categories_status_sort');
    t.foreign('parent_id').references('categories.id').onDelete('SET NULL');
  });

  await knex.schema.createTable('brands', (t) => {
    t.bigIncrements('id').unsigned().primary();
    t.string('name', 150).notNullable();
    t.string('slug', 180).notNullable();
    t.text('description').nullable();
    t.string('logo_url', 512).nullable();
    t.string('website_url', 512).nullable();
    t.integer('sort_order').notNullable().defaultTo(0);
    t.enum('status', ['active', 'inactive']).notNullable().defaultTo('active');
    t.timestamps(true, true);
    t.dateTime('deleted_at').nullable();
    t.unique(['slug'], { indexName: 'uq_brands_slug' });
    t.unique(['name'], { indexName: 'uq_brands_name' });
    t.index(['status'], 'idx_brands_status');
  });

  await knex.schema.createTable('specification_groups', (t) => {
    t.bigIncrements('id').unsigned().primary();
    t.string('code', 64).notNullable();
    t.string('name', 100).notNullable();
    t.string('description', 255).nullable();
    t.enum('input_type', ['select', 'swatch', 'text']).notNullable().defaultTo('select');
    t.boolean('is_required').notNullable().defaultTo(true);
    t.integer('sort_order').notNullable().defaultTo(0);
    t.timestamps(true, true);
    t.unique(['code'], { indexName: 'uq_spec_groups_code' });
  });

  await knex.schema.createTable('specification_options', (t) => {
    t.bigIncrements('id').unsigned().primary();
    t.bigInteger('group_id').unsigned().notNullable();
    t.string('code', 64).notNullable();
    t.string('name', 100).notNullable();
    t.json('metadata').nullable();
    t.integer('sort_order').notNullable().defaultTo(0);
    t.enum('status', ['active', 'inactive']).notNullable().defaultTo('active');
    t.timestamps(true, true);
    t.unique(['group_id', 'code'], { indexName: 'uq_spec_options_group_code' });
    t.index(['group_id'], 'idx_spec_options_group');
    t.foreign('group_id').references('specification_groups.id').onDelete('CASCADE');
  });
};

/** @param {import('knex').Knex} knex */
exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists('specification_options');
  await knex.schema.dropTableIfExists('specification_groups');
  await knex.schema.dropTableIfExists('brands');
  await knex.schema.dropTableIfExists('categories');
};

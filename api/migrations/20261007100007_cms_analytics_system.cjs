/**
 * CMS, analytics, notifications, audit logs, settings
 */

/** @param {import('knex').Knex} knex */
exports.up = async function up(knex) {
  await knex.schema.createTable('cms_sections', (t) => {
    t.bigIncrements('id').unsigned().primary();
    t.string('page', 50).notNullable().defaultTo('home');
    t.enum('section_type', [
      'hero_banner',
      'promo_banner',
      'featured_products',
      'latest_products',
      'category_tiles',
      'collection',
      'product_carousel',
      'custom_text',
      'spacer',
    ]).notNullable();
    t.string('title', 255).nullable();
    t.string('subtitle', 512).nullable();
    t.json('config').nullable();
    t.integer('sort_order').notNullable().defaultTo(0);
    t.enum('status', ['draft', 'published']).notNullable().defaultTo('draft');
    t.dateTime('starts_at').nullable();
    t.dateTime('ends_at').nullable();
    t.bigInteger('created_by').unsigned().nullable();
    t.bigInteger('updated_by').unsigned().nullable();
    t.timestamps(true, true);
    t.index(['page', 'status', 'sort_order'], 'idx_cms_page_status');
    t.foreign('created_by').references('users.id').onDelete('SET NULL');
    t.foreign('updated_by').references('users.id').onDelete('SET NULL');
  });

  await knex.schema.createTable('cms_banners', (t) => {
    t.bigIncrements('id').unsigned().primary();
    t.bigInteger('section_id').unsigned().notNullable();
    t.string('image_url', 512).notNullable();
    t.string('mobile_image_url', 512).nullable();
    t.string('alt_text', 255).nullable();
    t.string('link_url', 512).nullable();
    t.string('link_text', 100).nullable();
    t.integer('sort_order').notNullable().defaultTo(0);
    t.timestamp('created_at').defaultTo(knex.fn.now());
    t.index(['section_id', 'sort_order'], 'idx_banners_section');
    t.foreign('section_id').references('cms_sections.id').onDelete('CASCADE');
  });

  await knex.schema.createTable('cms_section_products', (t) => {
    t.bigInteger('section_id').unsigned().notNullable();
    t.bigInteger('product_id').unsigned().notNullable();
    t.integer('sort_order').notNullable().defaultTo(0);
    t.primary(['section_id', 'product_id']);
    t.foreign('section_id').references('cms_sections.id').onDelete('CASCADE');
    t.foreign('product_id').references('products.id').onDelete('CASCADE');
  });

  await knex.schema.createTable('analytics_events', (t) => {
    t.bigIncrements('id').unsigned().primary();
    t.string('event_type', 50).notNullable();
    t.bigInteger('user_id').unsigned().nullable();
    t.string('session_id', 128).nullable();
    t.bigInteger('product_id').unsigned().nullable();
    t.bigInteger('variant_id').unsigned().nullable();
    t.bigInteger('category_id').unsigned().nullable();
    t.bigInteger('order_id').unsigned().nullable();
    t.json('metadata').nullable();
    t.string('ip_hash', 64).nullable();
    t.string('user_agent', 512).nullable();
    t.timestamp('created_at').defaultTo(knex.fn.now());
    t.index(['event_type', 'created_at'], 'idx_ae_type_created');
    t.index(['product_id', 'event_type'], 'idx_ae_product');
    t.index(['user_id', 'created_at'], 'idx_ae_user');
    t.index(['session_id'], 'idx_ae_session');
  });

  await knex.schema.createTable('search_events', (t) => {
    t.bigIncrements('id').unsigned().primary();
    t.bigInteger('user_id').unsigned().nullable();
    t.string('session_id', 128).nullable();
    t.string('query', 255).notNullable();
    t.integer('results_count').notNullable().defaultTo(0);
    t.json('filters').nullable();
    t.timestamp('created_at').defaultTo(knex.fn.now());
    t.index(['created_at'], 'idx_se_created');
  });

  await knex.schema.createTable('notification_templates', (t) => {
    t.bigIncrements('id').unsigned().primary();
    t.string('code', 64).notNullable();
    t.enum('channel', ['sms', 'whatsapp', 'email']).notNullable();
    t.string('name', 150).notNullable();
    t.string('subject', 255).nullable();
    t.text('body_template').notNullable();
    t.enum('status', ['active', 'inactive']).notNullable().defaultTo('active');
    t.timestamps(true, true);
    t.unique(['code', 'channel'], { indexName: 'uq_nt_code_channel' });
  });

  await knex.schema.createTable('notification_logs', (t) => {
    t.bigIncrements('id').unsigned().primary();
    t.bigInteger('template_id').unsigned().nullable();
    t.enum('channel', ['sms', 'whatsapp', 'email']).notNullable();
    t.string('recipient', 255).notNullable();
    t.bigInteger('user_id').unsigned().nullable();
    t.bigInteger('order_id').unsigned().nullable();
    t.enum('status', ['queued', 'sent', 'delivered', 'failed']).notNullable().defaultTo('queued');
    t.string('provider_message_id', 128).nullable();
    t.string('error_message', 512).nullable();
    t.json('payload').nullable();
    t.dateTime('sent_at').nullable();
    t.timestamp('created_at').defaultTo(knex.fn.now());
    t.index(['user_id'], 'idx_nl_user');
    t.index(['order_id'], 'idx_nl_order');
    t.index(['status', 'created_at'], 'idx_nl_status');
    t.foreign('template_id').references('notification_templates.id').onDelete('SET NULL');
    t.foreign('user_id').references('users.id').onDelete('SET NULL');
  });

  await knex.schema.createTable('audit_logs', (t) => {
    t.bigIncrements('id').unsigned().primary();
    t.bigInteger('actor_id').unsigned().nullable();
    t.string('action', 100).notNullable();
    t.string('entity_type', 50).notNullable();
    t.bigInteger('entity_id').unsigned().nullable();
    t.json('old_values').nullable();
    t.json('new_values').nullable();
    t.string('ip_address', 45).nullable();
    t.string('user_agent', 512).nullable();
    t.timestamp('created_at').defaultTo(knex.fn.now());
    t.index(['actor_id', 'created_at'], 'idx_audit_actor');
    t.index(['entity_type', 'entity_id'], 'idx_audit_entity');
    t.index(['action', 'created_at'], 'idx_audit_action');
    t.foreign('actor_id').references('users.id').onDelete('SET NULL');
  });

  await knex.schema.createTable('settings', (t) => {
    t.bigIncrements('id').unsigned().primary();
    t.string('namespace', 50).notNullable().defaultTo('general');
    t.string('setting_key', 100).notNullable();
    t.text('setting_value').notNullable();
    t.enum('value_type', ['string', 'number', 'boolean', 'json']).notNullable().defaultTo('string');
    t.string('description', 255).nullable();
    t.bigInteger('updated_by').unsigned().nullable();
    t.timestamps(true, true);
    t.unique(['namespace', 'setting_key'], { indexName: 'uq_settings_ns_key' });
    t.foreign('updated_by').references('users.id').onDelete('SET NULL');
  });
};

/** @param {import('knex').Knex} knex */
exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists('settings');
  await knex.schema.dropTableIfExists('audit_logs');
  await knex.schema.dropTableIfExists('notification_logs');
  await knex.schema.dropTableIfExists('notification_templates');
  await knex.schema.dropTableIfExists('search_events');
  await knex.schema.dropTableIfExists('analytics_events');
  await knex.schema.dropTableIfExists('cms_section_products');
  await knex.schema.dropTableIfExists('cms_banners');
  await knex.schema.dropTableIfExists('cms_sections');
};

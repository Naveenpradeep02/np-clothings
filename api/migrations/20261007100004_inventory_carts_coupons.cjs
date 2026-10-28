/**
 * Inventory, carts, coupons
 */

/** @param {import('knex').Knex} knex */
exports.up = async function up(knex) {
  await knex.schema.createTable('inventory', (t) => {
    t.bigIncrements('id').unsigned().primary();
    t.bigInteger('variant_id').unsigned().notNullable();
    t.integer('quantity').notNullable().defaultTo(0);
    t.integer('reserved_quantity').notNullable().defaultTo(0);
    t.integer('low_stock_threshold').notNullable().defaultTo(5);
    t.timestamp('updated_at').defaultTo(knex.fn.now());
    t.unique(['variant_id'], { indexName: 'uq_inventory_variant' });
    t.foreign('variant_id').references('product_variants.id').onDelete('CASCADE');
  });

  // CHECK constraints (MySQL 8.0.16+)
  await knex.raw('ALTER TABLE inventory ADD CONSTRAINT chk_inventory_qty CHECK (quantity >= 0)');
  await knex.raw(
    'ALTER TABLE inventory ADD CONSTRAINT chk_inventory_reserved CHECK (reserved_quantity >= 0)'
  );

  await knex.schema.createTable('inventory_ledger', (t) => {
    t.bigIncrements('id').unsigned().primary();
    t.bigInteger('variant_id').unsigned().notNullable();
    t.enum('change_type', [
      'adjustment',
      'reservation',
      'release',
      'sale',
      'return',
      'cancellation',
    ]).notNullable();
    t.integer('quantity_delta').notNullable();
    t.integer('quantity_after').notNullable();
    t.string('reference_type', 50).nullable();
    t.bigInteger('reference_id').unsigned().nullable();
    t.string('reason', 255).nullable();
    t.bigInteger('actor_id').unsigned().nullable();
    t.timestamp('created_at').defaultTo(knex.fn.now());
    t.index(['variant_id', 'created_at'], 'idx_ledger_variant');
    t.index(['reference_type', 'reference_id'], 'idx_ledger_reference');
    t.foreign('variant_id').references('product_variants.id').onDelete('CASCADE');
    t.foreign('actor_id').references('users.id').onDelete('SET NULL');
  });

  await knex.schema.createTable('inventory_reservations', (t) => {
    t.bigIncrements('id').unsigned().primary();
    t.bigInteger('variant_id').unsigned().notNullable();
    t.bigInteger('cart_id').unsigned().nullable();
    t.bigInteger('order_id').unsigned().nullable();
    t.integer('quantity').notNullable();
    t.enum('status', ['active', 'consumed', 'released', 'expired']).notNullable().defaultTo('active');
    t.dateTime('expires_at').notNullable();
    t.timestamps(true, true);
    t.index(['variant_id', 'status'], 'idx_reservations_variant');
    t.index(['status', 'expires_at'], 'idx_reservations_expires');
    t.foreign('variant_id').references('product_variants.id').onDelete('CASCADE');
  });

  await knex.schema.createTable('carts', (t) => {
    t.bigIncrements('id').unsigned().primary();
    t.bigInteger('user_id').unsigned().nullable();
    t.string('session_id', 128).nullable();
    t.string('currency', 3).notNullable().defaultTo('INR');
    t.timestamps(true, true);
    t.dateTime('expires_at').nullable();
    t.index(['user_id'], 'idx_carts_user');
    t.index(['session_id'], 'idx_carts_session');
    t.foreign('user_id').references('users.id').onDelete('CASCADE');
  });

  await knex.schema.createTable('cart_items', (t) => {
    t.bigIncrements('id').unsigned().primary();
    t.bigInteger('cart_id').unsigned().notNullable();
    t.bigInteger('variant_id').unsigned().notNullable();
    t.integer('quantity').notNullable().defaultTo(1);
    t.timestamps(true, true);
    t.unique(['cart_id', 'variant_id'], { indexName: 'uq_cart_items_cart_variant' });
    t.foreign('cart_id').references('carts.id').onDelete('CASCADE');
    t.foreign('variant_id').references('product_variants.id').onDelete('CASCADE');
  });

  await knex.raw('ALTER TABLE cart_items ADD CONSTRAINT chk_cart_qty CHECK (quantity > 0)');

  await knex.schema.createTable('coupons', (t) => {
    t.bigIncrements('id').unsigned().primary();
    t.string('code', 50).notNullable();
    t.string('name', 150).notNullable();
    t.string('description', 512).nullable();
    t.enum('discount_type', ['percentage', 'fixed']).notNullable();
    t.decimal('discount_value', 12, 2).notNullable();
    t.decimal('min_order_value', 12, 2).nullable();
    t.decimal('max_discount', 12, 2).nullable();
    t.integer('usage_limit').nullable();
    t.integer('per_customer_limit').nullable();
    t.dateTime('starts_at').notNullable();
    t.dateTime('ends_at').notNullable();
    t.enum('status', ['active', 'inactive', 'expired']).notNullable().defaultTo('active');
    t.bigInteger('created_by').unsigned().nullable();
    t.timestamps(true, true);
    t.unique(['code'], { indexName: 'uq_coupons_code' });
    t.index(['status', 'starts_at', 'ends_at'], 'idx_coupons_status_dates');
    t.foreign('created_by').references('users.id').onDelete('SET NULL');
  });

  await knex.schema.createTable('coupon_rules', (t) => {
    t.bigIncrements('id').unsigned().primary();
    t.bigInteger('coupon_id').unsigned().notNullable();
    t.enum('rule_type', ['category', 'product', 'brand', 'exclude_product']).notNullable();
    t.bigInteger('reference_id').unsigned().notNullable();
    t.index(['coupon_id'], 'idx_coupon_rules_coupon');
    t.foreign('coupon_id').references('coupons.id').onDelete('CASCADE');
  });
};

/** @param {import('knex').Knex} knex */
exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists('coupon_rules');
  await knex.schema.dropTableIfExists('coupons');
  await knex.schema.dropTableIfExists('cart_items');
  await knex.schema.dropTableIfExists('carts');
  await knex.schema.dropTableIfExists('inventory_reservations');
  await knex.schema.dropTableIfExists('inventory_ledger');
  await knex.schema.dropTableIfExists('inventory');
};

/**
 * Orders, order items, status history, payments, events, refunds, coupon_redemptions
 */

/** @param {import('knex').Knex} knex */
exports.up = async function up(knex) {
  await knex.schema.createTable('orders', (t) => {
    t.bigIncrements('id').unsigned().primary();
    t.string('order_number', 32).notNullable();
    t.bigInteger('user_id').unsigned().notNullable();
    t.enum('status', [
      'pending',
      'confirmed',
      'processing',
      'packed',
      'shipped',
      'delivered',
      'cancelled',
      'return_requested',
      'return_approved',
      'return_received',
      'refunded',
    ])
      .notNullable()
      .defaultTo('pending');
    t.string('currency', 3).notNullable().defaultTo('INR');
    t.decimal('subtotal', 12, 2).notNullable();
    t.decimal('discount_amount', 12, 2).notNullable().defaultTo(0);
    t.decimal('tax_amount', 12, 2).notNullable().defaultTo(0);
    t.decimal('shipping_amount', 12, 2).notNullable().defaultTo(0);
    t.decimal('grand_total', 12, 2).notNullable();
    t.bigInteger('coupon_id').unsigned().nullable();
    t.string('coupon_code', 50).nullable();
    t.json('shipping_address').notNullable();
    t.json('billing_address').nullable();
    t.text('customer_note').nullable();
    t.text('internal_note').nullable();
    t.dateTime('confirmed_at').nullable();
    t.dateTime('cancelled_at').nullable();
    t.dateTime('delivered_at').nullable();
    t.timestamps(true, true);
    t.unique(['order_number'], { indexName: 'uq_orders_number' });
    t.index(['user_id', 'created_at'], 'idx_orders_user');
    t.index(['status'], 'idx_orders_status');
    t.index(['created_at'], 'idx_orders_created');
    t.foreign('user_id').references('users.id');
    t.foreign('coupon_id').references('coupons.id').onDelete('SET NULL');
  });

  await knex.schema.createTable('order_items', (t) => {
    t.bigIncrements('id').unsigned().primary();
    t.bigInteger('order_id').unsigned().notNullable();
    t.bigInteger('variant_id').unsigned().nullable();
    t.bigInteger('product_id').unsigned().nullable();
    t.string('product_name', 255).notNullable();
    t.string('sku', 64).notNullable();
    t.json('selected_options').notNullable();
    t.decimal('unit_price', 12, 2).notNullable();
    t.integer('quantity').notNullable();
    t.decimal('line_subtotal', 12, 2).notNullable();
    t.decimal('line_discount', 12, 2).notNullable().defaultTo(0);
    t.decimal('line_tax', 12, 2).notNullable().defaultTo(0);
    t.decimal('line_total', 12, 2).notNullable();
    t.timestamp('created_at').defaultTo(knex.fn.now());
    t.index(['order_id'], 'idx_order_items_order');
    t.index(['variant_id'], 'idx_order_items_variant');
    t.foreign('order_id').references('orders.id').onDelete('CASCADE');
    // intentionally no FK cascade from product_variants (immutable snapshots)
  });

  await knex.schema.createTable('order_status_history', (t) => {
    t.bigIncrements('id').unsigned().primary();
    t.bigInteger('order_id').unsigned().notNullable();
    t.string('from_status', 50).nullable();
    t.string('to_status', 50).notNullable();
    t.string('note', 512).nullable();
    t.bigInteger('actor_id').unsigned().nullable();
    t.timestamp('created_at').defaultTo(knex.fn.now());
    t.index(['order_id', 'created_at'], 'idx_osh_order');
    t.foreign('order_id').references('orders.id').onDelete('CASCADE');
    t.foreign('actor_id').references('users.id').onDelete('SET NULL');
  });

  await knex.schema.createTable('coupon_redemptions', (t) => {
    t.bigIncrements('id').unsigned().primary();
    t.bigInteger('coupon_id').unsigned().notNullable();
    t.bigInteger('user_id').unsigned().notNullable();
    t.bigInteger('order_id').unsigned().notNullable();
    t.decimal('discount_amount', 12, 2).notNullable();
    t.timestamp('created_at').defaultTo(knex.fn.now());
    t.index(['coupon_id'], 'idx_redemptions_coupon');
    t.index(['user_id'], 'idx_redemptions_user');
    t.unique(['order_id'], { indexName: 'uq_redemption_order' });
    t.foreign('coupon_id').references('coupons.id');
    t.foreign('user_id').references('users.id');
    t.foreign('order_id').references('orders.id');
  });

  await knex.schema.createTable('payments', (t) => {
    t.bigIncrements('id').unsigned().primary();
    t.bigInteger('order_id').unsigned().notNullable();
    t.string('provider', 50).notNullable();
    t.string('provider_payment_id', 128).nullable();
    t.decimal('amount', 12, 2).notNullable();
    t.string('currency', 3).notNullable().defaultTo('INR');
    t.enum('status', [
      'pending',
      'authorized',
      'processing',
      'paid',
      'failed',
      'cancelled',
      'partially_refunded',
      'refunded',
    ])
      .notNullable()
      .defaultTo('pending');
    t.string('method', 50).nullable();
    t.dateTime('paid_at').nullable();
    t.string('failure_reason', 512).nullable();
    t.json('raw_response').nullable();
    t.timestamps(true, true);
    t.index(['order_id'], 'idx_payments_order');
    t.index(['provider', 'provider_payment_id'], 'idx_payments_provider_id');
    t.index(['status'], 'idx_payments_status');
    t.foreign('order_id').references('orders.id');
  });

  await knex.schema.createTable('payment_events', (t) => {
    t.bigIncrements('id').unsigned().primary();
    t.bigInteger('payment_id').unsigned().nullable();
    t.string('provider', 50).notNullable();
    t.string('provider_event_id', 128).notNullable();
    t.string('event_type', 100).notNullable();
    t.json('payload').notNullable();
    t.boolean('processed').notNullable().defaultTo(false);
    t.dateTime('processed_at').nullable();
    t.timestamp('created_at').defaultTo(knex.fn.now());
    t.unique(['provider', 'provider_event_id'], { indexName: 'uq_payment_events_provider_event' });
    t.index(['payment_id'], 'idx_pe_payment');
    t.foreign('payment_id').references('payments.id').onDelete('SET NULL');
  });

  await knex.schema.createTable('refunds', (t) => {
    t.bigIncrements('id').unsigned().primary();
    t.bigInteger('payment_id').unsigned().notNullable();
    t.bigInteger('order_id').unsigned().notNullable();
    t.decimal('amount', 12, 2).notNullable();
    t.string('reason', 512).nullable();
    t.enum('status', ['pending', 'processing', 'completed', 'failed'])
      .notNullable()
      .defaultTo('pending');
    t.string('provider_refund_id', 128).nullable();
    t.bigInteger('processed_by').unsigned().nullable();
    t.dateTime('processed_at').nullable();
    t.timestamps(true, true);
    t.index(['payment_id'], 'idx_refunds_payment');
    t.index(['order_id'], 'idx_refunds_order');
    t.foreign('payment_id').references('payments.id');
    t.foreign('order_id').references('orders.id');
    t.foreign('processed_by').references('users.id').onDelete('SET NULL');
  });
};

/** @param {import('knex').Knex} knex */
exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists('refunds');
  await knex.schema.dropTableIfExists('payment_events');
  await knex.schema.dropTableIfExists('payments');
  await knex.schema.dropTableIfExists('coupon_redemptions');
  await knex.schema.dropTableIfExists('order_status_history');
  await knex.schema.dropTableIfExists('order_items');
  await knex.schema.dropTableIfExists('orders');
};

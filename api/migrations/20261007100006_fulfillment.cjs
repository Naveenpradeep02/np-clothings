/**
 * Shipping, returns, reviews, support, wishlist
 */

/** @param {import('knex').Knex} knex */
exports.up = async function up(knex) {
  await knex.schema.createTable('shipments', (t) => {
    t.bigIncrements('id').unsigned().primary();
    t.bigInteger('order_id').unsigned().notNullable();
    t.string('courier_name', 100).notNullable();
    t.string('courier_code', 50).nullable();
    t.string('tracking_number', 100).nullable();
    t.string('tracking_url', 512).nullable();
    t.enum('status', [
      'label_created',
      'picked_up',
      'in_transit',
      'out_for_delivery',
      'delivered',
      'exception',
      'returned_to_sender',
    ])
      .notNullable()
      .defaultTo('label_created');
    t.string('provider', 50).nullable();
    t.string('provider_shipment_id', 128).nullable();
    t.dateTime('shipped_at').nullable();
    t.dateTime('delivered_at').nullable();
    t.bigInteger('created_by').unsigned().nullable();
    t.timestamps(true, true);
    t.index(['order_id'], 'idx_shipments_order');
    t.index(['tracking_number'], 'idx_shipments_tracking');
    t.index(['status'], 'idx_shipments_status');
    t.foreign('order_id').references('orders.id').onDelete('CASCADE');
    t.foreign('created_by').references('users.id').onDelete('SET NULL');
  });

  await knex.schema.createTable('tracking_events', (t) => {
    t.bigIncrements('id').unsigned().primary();
    t.bigInteger('shipment_id').unsigned().notNullable();
    t.string('status', 50).notNullable();
    t.string('description', 512).nullable();
    t.string('location', 255).nullable();
    t.dateTime('event_time').notNullable();
    t.string('provider_event_id', 128).nullable();
    t.json('raw_payload').nullable();
    t.timestamp('created_at').defaultTo(knex.fn.now());
    t.index(['shipment_id', 'event_time'], 'idx_te_shipment');
    t.unique(['shipment_id', 'provider_event_id'], {
      indexName: 'uq_te_provider_event',
    });
    t.foreign('shipment_id').references('shipments.id').onDelete('CASCADE');
  });

  await knex.schema.createTable('return_requests', (t) => {
    t.bigIncrements('id').unsigned().primary();
    t.bigInteger('order_id').unsigned().notNullable();
    t.bigInteger('user_id').unsigned().notNullable();
    t.enum('status', [
      'requested',
      'under_review',
      'approved',
      'rejected',
      'pickup_scheduled',
      'received',
      'inspected',
      'refund_pending',
      'refunded',
      'closed',
    ])
      .notNullable()
      .defaultTo('requested');
    t.enum('reason_code', ['size_issue', 'open_box_damage', 'other']).notNullable();
    t.text('reason_text').nullable();
    t.json('evidence_urls').nullable();
    t.text('admin_note').nullable();
    t.bigInteger('reviewed_by').unsigned().nullable();
    t.dateTime('reviewed_at').nullable();
    t.timestamps(true, true);
    t.index(['order_id'], 'idx_rr_order');
    t.index(['user_id'], 'idx_rr_user');
    t.index(['status'], 'idx_rr_status');
    t.foreign('order_id').references('orders.id');
    t.foreign('user_id').references('users.id');
    t.foreign('reviewed_by').references('users.id').onDelete('SET NULL');
  });

  await knex.schema.createTable('return_items', (t) => {
    t.bigIncrements('id').unsigned().primary();
    t.bigInteger('return_request_id').unsigned().notNullable();
    t.bigInteger('order_item_id').unsigned().notNullable();
    t.integer('quantity').notNullable().defaultTo(1);
    t.string('condition_notes', 512).nullable();
    t.timestamp('created_at').defaultTo(knex.fn.now());
    t.index(['return_request_id'], 'idx_ri_request');
    t.foreign('return_request_id').references('return_requests.id').onDelete('CASCADE');
    t.foreign('order_item_id').references('order_items.id');
  });

  await knex.schema.createTable('refund_records', (t) => {
    t.bigIncrements('id').unsigned().primary();
    t.bigInteger('return_request_id').unsigned().notNullable();
    t.bigInteger('refund_id').unsigned().notNullable();
    t.timestamp('created_at').defaultTo(knex.fn.now());
    t.unique(['return_request_id', 'refund_id'], { indexName: 'uq_refund_records' });
    t.foreign('return_request_id').references('return_requests.id');
    t.foreign('refund_id').references('refunds.id');
  });

  await knex.schema.createTable('reviews', (t) => {
    t.bigIncrements('id').unsigned().primary();
    t.bigInteger('product_id').unsigned().notNullable();
    t.bigInteger('variant_id').unsigned().nullable();
    t.bigInteger('user_id').unsigned().notNullable();
    t.bigInteger('order_id').unsigned().nullable();
    t.integer('rating').unsigned().notNullable();
    t.string('title', 255).nullable();
    t.text('body').nullable();
    t.enum('status', ['pending', 'approved', 'rejected', 'hidden'])
      .notNullable()
      .defaultTo('pending');
    t.boolean('is_verified_purchase').notNullable().defaultTo(false);
    t.timestamps(true, true);
    t.index(['product_id', 'status'], 'idx_reviews_product');
    t.index(['user_id'], 'idx_reviews_user');
    t.foreign('product_id').references('products.id').onDelete('CASCADE');
    t.foreign('variant_id').references('product_variants.id').onDelete('SET NULL');
    t.foreign('user_id').references('users.id');
    t.foreign('order_id').references('orders.id').onDelete('SET NULL');
  });

  await knex.raw('ALTER TABLE reviews ADD CONSTRAINT chk_rating CHECK (rating BETWEEN 1 AND 5)');

  await knex.schema.createTable('review_media', (t) => {
    t.bigIncrements('id').unsigned().primary();
    t.bigInteger('review_id').unsigned().notNullable();
    t.string('url', 512).notNullable();
    t.integer('sort_order').notNullable().defaultTo(0);
    t.timestamp('created_at').defaultTo(knex.fn.now());
    t.index(['review_id'], 'idx_rm_review');
    t.foreign('review_id').references('reviews.id').onDelete('CASCADE');
  });

  await knex.schema.createTable('review_moderation', (t) => {
    t.bigIncrements('id').unsigned().primary();
    t.bigInteger('review_id').unsigned().notNullable();
    t.enum('action', ['approve', 'reject', 'hide', 'report']).notNullable();
    t.string('reason', 512).nullable();
    t.bigInteger('actor_id').unsigned().notNullable();
    t.timestamp('created_at').defaultTo(knex.fn.now());
    t.index(['review_id'], 'idx_rmod_review');
    t.foreign('review_id').references('reviews.id').onDelete('CASCADE');
    t.foreign('actor_id').references('users.id');
  });

  await knex.schema.createTable('support_tickets', (t) => {
    t.bigIncrements('id').unsigned().primary();
    t.string('ticket_number', 32).notNullable();
    t.bigInteger('user_id').unsigned().notNullable();
    t.bigInteger('order_id').unsigned().nullable();
    t.string('subject', 255).notNullable();
    t.enum('status', ['open', 'in_progress', 'waiting_customer', 'resolved', 'closed'])
      .notNullable()
      .defaultTo('open');
    t.enum('priority', ['low', 'medium', 'high', 'urgent']).notNullable().defaultTo('medium');
    t.bigInteger('assigned_to').unsigned().nullable();
    t.enum('channel', ['web', 'whatsapp', 'email', 'phone']).notNullable().defaultTo('web');
    t.timestamps(true, true);
    t.dateTime('closed_at').nullable();
    t.unique(['ticket_number'], { indexName: 'uq_tickets_number' });
    t.index(['user_id'], 'idx_tickets_user');
    t.index(['status'], 'idx_tickets_status');
    t.index(['assigned_to'], 'idx_tickets_assigned');
    t.foreign('user_id').references('users.id');
    t.foreign('order_id').references('orders.id').onDelete('SET NULL');
    t.foreign('assigned_to').references('users.id').onDelete('SET NULL');
  });

  await knex.schema.createTable('support_messages', (t) => {
    t.bigIncrements('id').unsigned().primary();
    t.bigInteger('ticket_id').unsigned().notNullable();
    t.bigInteger('sender_id').unsigned().notNullable();
    t.enum('sender_type', ['customer', 'employee', 'system']).notNullable();
    t.text('body').notNullable();
    t.boolean('is_internal').notNullable().defaultTo(false);
    t.timestamp('created_at').defaultTo(knex.fn.now());
    t.index(['ticket_id', 'created_at'], 'idx_sm_ticket');
    t.foreign('ticket_id').references('support_tickets.id').onDelete('CASCADE');
    t.foreign('sender_id').references('users.id');
  });

  await knex.schema.createTable('ticket_attachments', (t) => {
    t.bigIncrements('id').unsigned().primary();
    t.bigInteger('ticket_id').unsigned().notNullable();
    t.bigInteger('message_id').unsigned().nullable();
    t.string('url', 512).notNullable();
    t.string('file_name', 255).notNullable();
    t.string('mime_type', 100).nullable();
    t.integer('size_bytes').nullable();
    t.timestamp('created_at').defaultTo(knex.fn.now());
    t.index(['ticket_id'], 'idx_ta_ticket');
    t.foreign('ticket_id').references('support_tickets.id').onDelete('CASCADE');
    t.foreign('message_id').references('support_messages.id').onDelete('SET NULL');
  });

  await knex.schema.createTable('wishlist_items', (t) => {
    t.bigIncrements('id').unsigned().primary();
    t.bigInteger('user_id').unsigned().notNullable();
    t.bigInteger('product_id').unsigned().notNullable();
    t.bigInteger('variant_id').unsigned().nullable();
    t.timestamp('created_at').defaultTo(knex.fn.now());
    t.unique(['user_id', 'product_id', 'variant_id'], {
      indexName: 'uq_wishlist_user_product_variant',
    });
    t.foreign('user_id').references('users.id').onDelete('CASCADE');
    t.foreign('product_id').references('products.id').onDelete('CASCADE');
    t.foreign('variant_id').references('product_variants.id').onDelete('SET NULL');
  });
};

/** @param {import('knex').Knex} knex */
exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists('wishlist_items');
  await knex.schema.dropTableIfExists('ticket_attachments');
  await knex.schema.dropTableIfExists('support_messages');
  await knex.schema.dropTableIfExists('support_tickets');
  await knex.schema.dropTableIfExists('review_moderation');
  await knex.schema.dropTableIfExists('review_media');
  await knex.schema.dropTableIfExists('reviews');
  await knex.schema.dropTableIfExists('refund_records');
  await knex.schema.dropTableIfExists('return_items');
  await knex.schema.dropTableIfExists('return_requests');
  await knex.schema.dropTableIfExists('tracking_events');
  await knex.schema.dropTableIfExists('shipments');
};

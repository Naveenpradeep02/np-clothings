/**
 * Coupons, settings, notification templates, basic CMS hero
 */

/** @param {import('knex').Knex} knex */
exports.seed = async function seed(knex) {
  const now = new Date();
  const in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  async function ensureCoupon(row) {
    const existing = await knex('coupons').where({ code: row.code }).first();
    if (!existing) {
      await knex('coupons').insert({
        ...row,
        created_at: knex.fn.now(),
        updated_at: knex.fn.now(),
      });
    }
  }

  await ensureCoupon({
    code: 'WELCOME10',
    name: 'Welcome 10%',
    description: '10% off for new customers',
    discount_type: 'percentage',
    discount_value: 10,
    min_order_value: 2000,
    max_discount: 1500,
    usage_limit: 1000,
    per_customer_limit: 1,
    starts_at: now,
    ends_at: in30,
    status: 'active',
  });

  await ensureCoupon({
    code: 'FLAT500',
    name: 'Flat ₹500',
    description: '₹500 off on orders above ₹5000',
    discount_type: 'fixed',
    discount_value: 500,
    min_order_value: 5000,
    max_discount: null,
    usage_limit: null,
    per_customer_limit: 3,
    starts_at: now,
    ends_at: in30,
    status: 'active',
  });

  const settings = [
    {
      namespace: 'returns',
      setting_key: 'window_days',
      setting_value: '7',
      value_type: 'number',
      description: 'Days after delivery to request a return',
    },
    {
      namespace: 'returns',
      setting_key: 'allowed_reasons',
      setting_value: JSON.stringify(['size_issue', 'open_box_damage']),
      value_type: 'json',
      description: 'Allowed return reason codes',
    },
    {
      namespace: 'inventory',
      setting_key: 'default_low_stock',
      setting_value: '5',
      value_type: 'number',
      description: 'Default low-stock threshold',
    },
    {
      namespace: 'shipping',
      setting_key: 'free_above',
      setting_value: '3000',
      value_type: 'number',
      description: 'Free shipping above this amount (INR)',
    },
    {
      namespace: 'currency',
      setting_key: 'default',
      setting_value: 'INR',
      value_type: 'string',
      description: 'Default currency',
    },
    {
      namespace: 'tax',
      setting_key: 'rate_percent',
      setting_value: '18',
      value_type: 'number',
      description: 'Default tax percentage',
    },
  ];

  for (const s of settings) {
    const exists = await knex('settings')
      .where({ namespace: s.namespace, setting_key: s.setting_key })
      .first();
    if (!exists) {
      await knex('settings').insert({
        ...s,
        created_at: knex.fn.now(),
        updated_at: knex.fn.now(),
      });
    }
  }

  const templates = [
    {
      code: 'order_confirmed',
      channel: 'sms',
      name: 'Order confirmed SMS',
      body_template: 'AUREA: Order {{order_number}} confirmed. Total {{grand_total}}.',
    },
    {
      code: 'order_confirmed',
      channel: 'whatsapp',
      name: 'Order confirmed WhatsApp',
      body_template: 'Your AUREA order {{order_number}} is confirmed. Total: {{grand_total}}.',
    },
    {
      code: 'payment_received',
      channel: 'sms',
      name: 'Payment received',
      body_template: 'AUREA: Payment received for order {{order_number}}.',
    },
    {
      code: 'order_shipped',
      channel: 'sms',
      name: 'Order shipped SMS',
      body_template: 'AUREA: Order {{order_number}} shipped. Track: {{tracking_number}}',
    },
    {
      code: 'order_shipped',
      channel: 'whatsapp',
      name: 'Order shipped WhatsApp',
      body_template: 'Your order {{order_number}} is on the way. Tracking: {{tracking_number}}',
    },
    {
      code: 'order_delivered',
      channel: 'sms',
      name: 'Order delivered',
      body_template: 'AUREA: Order {{order_number}} delivered. We hope you love it.',
    },
    {
      code: 'return_approved',
      channel: 'sms',
      name: 'Return approved',
      body_template: 'AUREA: Your return for order {{order_number}} was approved.',
    },
    {
      code: 'return_rejected',
      channel: 'sms',
      name: 'Return rejected',
      body_template: 'AUREA: Return for order {{order_number}} was not approved. {{reason}}',
    },
  ];

  for (const t of templates) {
    const exists = await knex('notification_templates')
      .where({ code: t.code, channel: t.channel })
      .first();
    if (!exists) {
      await knex('notification_templates').insert({
        ...t,
        status: 'active',
        created_at: knex.fn.now(),
        updated_at: knex.fn.now(),
      });
    }
  }

  // Minimal published CMS hero
  let hero = await knex('cms_sections')
    .where({ page: 'home', section_type: 'hero_banner', title: 'Quiet Luxury' })
    .first();
  if (!hero) {
    const [sid] = await knex('cms_sections').insert({
      page: 'home',
      section_type: 'hero_banner',
      title: 'Quiet Luxury',
      subtitle: 'Timeless pieces for the considered wardrobe',
      sort_order: 0,
      status: 'published',
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    });
    await knex('cms_banners').insert({
      section_id: sid,
      image_url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1600&q=80',
      alt_text: 'AUREA campaign',
      link_url: '/shop',
      link_text: 'Explore Collection',
      sort_order: 0,
      created_at: knex.fn.now(),
    });
  }
};

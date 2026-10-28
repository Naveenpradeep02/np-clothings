import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { renderTemplate } from '../../lib/templateRender.js';
import { MockSmsProvider } from '../../services/notification/MockSmsProvider.js';

describe('renderTemplate', () => {
  it('replaces placeholders', () => {
    const out = renderTemplate('Hi {{customer_name}}, order {{order_number}}', {
      customer_name: 'Asha',
      order_number: 'AU-1',
    });
    assert.equal(out, 'Hi Asha, order AU-1');
  });

  it('empty for missing keys', () => {
    assert.equal(renderTemplate('X {{missing}} Y', {}), 'X  Y');
  });
});

describe('MockSmsProvider', () => {
  it('returns message id', async () => {
    const p = new MockSmsProvider();
    const r = await p.send({ to: '+91', body: 'test' });
    assert.ok(r.success);
    assert.ok(r.providerMessageId.startsWith('mock_sms_'));
  });
});

/**
 * Mock SMS provider — logs only, no external calls.
 */
export class MockSmsProvider {
  constructor() {
    this.name = 'mock_sms';
  }

  async send({ to, body }) {
    const id = `mock_sms_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    return {
      success: true,
      providerMessageId: id,
      raw: { to, body, mock: true },
    };
  }
}

export default MockSmsProvider;

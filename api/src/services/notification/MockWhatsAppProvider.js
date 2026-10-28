/**
 * Mock WhatsApp provider — logs only.
 */
export class MockWhatsAppProvider {
  constructor() {
    this.name = 'mock_whatsapp';
  }

  async send({ to, body }) {
    const id = `mock_wa_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    return {
      success: true,
      providerMessageId: id,
      raw: { to, body, mock: true },
    };
  }
}

export default MockWhatsAppProvider;

/**
 * Twilio SMS adapter structure.
 * Requires TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER.
 */

export class TwilioSmsProvider {
  constructor(config = {}) {
    this.name = 'twilio_sms';
    this.accountSid = config.accountSid || process.env.TWILIO_ACCOUNT_SID || '';
    this.authToken = config.authToken || process.env.TWILIO_AUTH_TOKEN || '';
    this.from = config.from || process.env.TWILIO_FROM_NUMBER || '';
  }

  async send({ to, body }) {
    if (!this.accountSid || !this.authToken || !this.from) {
      const err = new Error('Twilio SMS is not configured');
      err.code = 'SMS_PROVIDER_UNCONFIGURED';
      err.status = 503;
      throw err;
    }

    const auth = Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64');
    const params = new URLSearchParams({
      To: to,
      From: this.from,
      Body: body,
    });

    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      }
    );

    const data = await res.json();
    if (!res.ok) {
      const err = new Error(data?.message || 'Twilio send failed');
      err.status = 502;
      err.code = 'SMS_PROVIDER_ERROR';
      err.details = data;
      throw err;
    }

    return {
      success: true,
      providerMessageId: data.sid,
      raw: data,
    };
  }
}

export default TwilioSmsProvider;

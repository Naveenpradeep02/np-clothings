import { MockSmsProvider } from './MockSmsProvider.js';
import { MockWhatsAppProvider } from './MockWhatsAppProvider.js';
import { TwilioSmsProvider } from './TwilioSmsProvider.js';

let smsProvider = null;
let waProvider = null;

export function getSmsProvider() {
  if (smsProvider) return smsProvider;
  const name = (process.env.SMS_PROVIDER || 'mock').toLowerCase();
  if (name === 'twilio') {
    smsProvider = new TwilioSmsProvider();
  } else {
    smsProvider = new MockSmsProvider();
  }
  return smsProvider;
}

export function getWhatsAppProvider() {
  if (waProvider) return waProvider;
  // Meta / Twilio WhatsApp can be added; default mock
  waProvider = new MockWhatsAppProvider();
  return waProvider;
}

export function resetNotificationProviders() {
  smsProvider = null;
  waProvider = null;
}

export default { getSmsProvider, getWhatsAppProvider, resetNotificationProviders };

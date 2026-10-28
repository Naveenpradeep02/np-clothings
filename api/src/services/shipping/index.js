import { MockShippingProvider } from './MockShippingProvider.js';
import { TrackingMoreProvider } from './TrackingMoreProvider.js';

let instance = null;

export function getShippingProvider() {
  if (instance) return instance;
  const name = (process.env.SHIPPING_PROVIDER || 'mock').toLowerCase();
  if (name === 'trackingmore') {
    instance = new TrackingMoreProvider();
  } else {
    instance = new MockShippingProvider();
  }
  return instance;
}

export function resetShippingProvider() {
  instance = null;
}

export default { getShippingProvider, resetShippingProvider };

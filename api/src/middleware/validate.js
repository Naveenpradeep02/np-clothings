/**
 * Lightweight request validation middleware.
 * Usage:
 *   validate({ body: { email: { type: 'string', required: true } } })
 *
 * Supported field rules: type, required, min, max, enum, pattern (RegExp)
 */

import { ValidationError } from '../lib/errors.js';

function validateValue(key, value, rule) {
  const errors = [];

  if (value === undefined || value === null || value === '') {
    if (rule.required) errors.push(`${key} is required`);
    return errors;
  }

  if (rule.type === 'string' && typeof value !== 'string') {
    errors.push(`${key} must be a string`);
  }
  if (rule.type === 'number' && (typeof value !== 'number' || Number.isNaN(value))) {
    // coerce query strings
    if (rule.coerce && value !== '' && !Number.isNaN(Number(value))) {
      // ok — caller should coerce; we only check after coerce in parse layer
    } else if (typeof value === 'string' && !Number.isNaN(Number(value))) {
      // allow numeric strings from query
    } else {
      errors.push(`${key} must be a number`);
    }
  }
  if (rule.type === 'boolean' && typeof value !== 'boolean') {
    if (!(value === 'true' || value === 'false' || value === '1' || value === '0')) {
      errors.push(`${key} must be a boolean`);
    }
  }
  if (rule.type === 'array' && !Array.isArray(value)) {
    errors.push(`${key} must be an array`);
  }
  if (rule.type === 'object' && (typeof value !== 'object' || Array.isArray(value) || value === null)) {
    errors.push(`${key} must be an object`);
  }

  if (typeof value === 'string') {
    if (rule.min !== undefined && value.length < rule.min) {
      errors.push(`${key} must be at least ${rule.min} characters`);
    }
    if (rule.max !== undefined && value.length > rule.max) {
      errors.push(`${key} must be at most ${rule.max} characters`);
    }
    if (rule.pattern && !rule.pattern.test(value)) {
      errors.push(`${key} has invalid format`);
    }
  }

  if (typeof value === 'number' || (rule.type === 'number' && value !== '' && !Number.isNaN(Number(value)))) {
    const n = Number(value);
    if (rule.min !== undefined && n < rule.min) errors.push(`${key} must be >= ${rule.min}`);
    if (rule.max !== undefined && n > rule.max) errors.push(`${key} must be <= ${rule.max}`);
  }

  if (rule.enum && !rule.enum.includes(value)) {
    errors.push(`${key} must be one of: ${rule.enum.join(', ')}`);
  }

  return errors;
}

function validateObject(obj, schema, prefix = '') {
  const errors = [];
  for (const [key, rule] of Object.entries(schema)) {
    const path = prefix ? `${prefix}.${key}` : key;
    errors.push(...validateValue(path, obj?.[key], rule));
  }
  return errors;
}

/**
 * @param {{ body?: object, query?: object, params?: object }} schemas
 */
export function validate(schemas = {}) {
  return (req, res, next) => {
    const errors = [];
    if (schemas.body) errors.push(...validateObject(req.body, schemas.body));
    if (schemas.query) errors.push(...validateObject(req.query, schemas.query));
    if (schemas.params) errors.push(...validateObject(req.params, schemas.params));

    if (errors.length) {
      return next(new ValidationError('Validation failed', errors));
    }
    next();
  };
}

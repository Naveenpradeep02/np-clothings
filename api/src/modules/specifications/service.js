import * as repo from './repository.js';
import { writeAudit } from '../audit/service.js';
import {
  NotFoundError,
  BadRequestError,
  ConflictError,
  ServiceUnavailableError,
  AppError,
} from '../../lib/errors.js';
import logger from '../../lib/logger.js';

function codeify(text) {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 64);
}

function wrap(fn, err) {
  if (err instanceof AppError) throw err;
  logger.error(`specifications.${fn} failed`, err);
  if (err.code === 'ER_DUP_ENTRY' || /duplicate/i.test(err.message || '')) {
    throw new ConflictError('Duplicate code for this group');
  }
  throw new ServiceUnavailableError('Specifications temporarily unavailable');
}

export async function listGroups() {
  try {
    return await repo.listGroups();
  } catch (err) {
    wrap('listGroups', err);
  }
}

export async function getGroup(id) {
  try {
    const row = await repo.findGroupById(id);
    if (!row) throw new NotFoundError('Specification group not found');
    const options = await repo.listOptions({ groupId: id });
    return { ...row, options };
  } catch (err) {
    wrap('getGroup', err);
  }
}

export async function createGroup(actor, body) {
  try {
    if (!body?.name?.trim()) throw new BadRequestError('name is required');
    const name = body.name.trim();
    const code = body.code ? codeify(body.code) : codeify(name);
    if (!code) throw new BadRequestError('Invalid code');

    if (await repo.findGroupByCode(code)) {
      throw new ConflictError(`Group code already exists: ${code}`);
    }

    const input_type = body.input_type || 'select';
    if (!['select', 'swatch', 'text'].includes(input_type)) {
      throw new BadRequestError('input_type must be select, swatch, or text');
    }

    const row = await repo.createGroup({
      code,
      name,
      description: body.description ?? null,
      input_type,
      is_required: body.is_required !== false,
      sort_order: Number(body.sort_order) || 0,
    });

    await writeAudit({
      actorId: actor?.id,
      action: 'spec_group.created',
      entityType: 'specification_group',
      entityId: row.id,
      newValues: { code, name },
    });

    return row;
  } catch (err) {
    wrap('createGroup', err);
  }
}

export async function updateGroup(actor, id, body) {
  try {
    const current = await repo.findGroupById(id);
    if (!current) throw new NotFoundError('Specification group not found');

    const patch = {};
    if (body.name !== undefined) {
      if (!String(body.name).trim()) throw new BadRequestError('name cannot be empty');
      patch.name = String(body.name).trim();
    }
    if (body.description !== undefined) patch.description = body.description;
    if (body.input_type !== undefined) {
      if (!['select', 'swatch', 'text'].includes(body.input_type)) {
        throw new BadRequestError('input_type must be select, swatch, or text');
      }
      patch.input_type = body.input_type;
    }
    if (body.is_required !== undefined) patch.is_required = Boolean(body.is_required);
    if (body.sort_order !== undefined) patch.sort_order = Number(body.sort_order) || 0;

    const row = await repo.updateGroup(id, patch);
    await writeAudit({
      actorId: actor?.id,
      action: 'spec_group.updated',
      entityType: 'specification_group',
      entityId: Number(id),
      oldValues: { name: current.name },
      newValues: patch,
    });
    return row;
  } catch (err) {
    wrap('updateGroup', err);
  }
}

export async function listOptions(filters = {}) {
  try {
    return await repo.listOptions(filters);
  } catch (err) {
    wrap('listOptions', err);
  }
}

export async function createOption(actor, body) {
  try {
    if (!body?.group_id) throw new BadRequestError('group_id is required');
    if (!body?.name?.trim()) throw new BadRequestError('name is required');

    const group = await repo.findGroupById(body.group_id);
    if (!group) throw new BadRequestError('group_id does not exist');

    const name = body.name.trim();
    const code = body.code ? codeify(body.code) : codeify(name);
    if (!code) throw new BadRequestError('Invalid code');

    if (await repo.findOptionByGroupAndCode(group.id, code)) {
      throw new ConflictError(`Option code already exists in group: ${code}`);
    }

    if (body.status && !['active', 'inactive'].includes(body.status)) {
      throw new BadRequestError('status must be active or inactive');
    }

    let metadata = body.metadata ?? null;
    if (typeof metadata === 'string') {
      try {
        metadata = JSON.parse(metadata);
      } catch {
        throw new BadRequestError('metadata must be valid JSON');
      }
    }

    const row = await repo.createOption({
      group_id: group.id,
      code,
      name,
      metadata,
      sort_order: Number(body.sort_order) || 0,
      status: body.status || 'active',
    });

    await writeAudit({
      actorId: actor?.id,
      action: 'spec_option.created',
      entityType: 'specification_option',
      entityId: row.id,
      newValues: { group_id: group.id, code, name },
    });

    return row;
  } catch (err) {
    wrap('createOption', err);
  }
}

export async function updateOption(actor, id, body) {
  try {
    const current = await repo.findOptionById(id);
    if (!current) throw new NotFoundError('Specification option not found');

    const patch = {};
    if (body.name !== undefined) {
      if (!String(body.name).trim()) throw new BadRequestError('name cannot be empty');
      patch.name = String(body.name).trim();
    }
    if (body.sort_order !== undefined) patch.sort_order = Number(body.sort_order) || 0;
    if (body.status !== undefined) {
      if (!['active', 'inactive'].includes(body.status)) {
        throw new BadRequestError('status must be active or inactive');
      }
      patch.status = body.status;
    }
    if (body.metadata !== undefined) {
      let metadata = body.metadata;
      if (typeof metadata === 'string') {
        try {
          metadata = JSON.parse(metadata);
        } catch {
          throw new BadRequestError('metadata must be valid JSON');
        }
      }
      patch.metadata = metadata;
    }

    const row = await repo.updateOption(id, patch);
    await writeAudit({
      actorId: actor?.id,
      action: 'spec_option.updated',
      entityType: 'specification_option',
      entityId: Number(id),
      newValues: patch,
    });
    return row;
  } catch (err) {
    wrap('updateOption', err);
  }
}

/**
 * Validate a set of option IDs for a product:
 * - all options exist and are active
 * - at most one option per group
 * - required groups for the product are present (if productSpecs provided)
 */
export async function validateOptionSet(optionIds, { requiredGroupIds = [] } = {}) {
  const ids = [...new Set(optionIds.map(Number))];
  const options = await repo.findOptionsByIds(ids);
  if (options.length !== ids.length) {
    throw new BadRequestError('One or more option IDs are invalid');
  }
  for (const o of options) {
    if (o.status !== 'active') {
      throw new BadRequestError(`Option ${o.code} is inactive`);
    }
  }
  const byGroup = new Map();
  for (const o of options) {
    if (byGroup.has(o.group_id)) {
      throw new BadRequestError(`Multiple options selected for group ${o.group_code}`);
    }
    byGroup.set(o.group_id, o);
  }
  for (const gid of requiredGroupIds) {
    if (!byGroup.has(Number(gid))) {
      throw new BadRequestError(`Missing required specification group id ${gid}`);
    }
  }
  return options;
}

// ----- Category-Level Specification Sets -----
export async function getCategorySpecifications(categoryId) {
  try {
    const catId = Number(categoryId);
    const assignedGroups = await repo.getCategorySpecificationGroups(catId);
    const assignedOptionIds = new Set(await repo.getCategorySpecificationOptionIds(catId));

    // Get all groups and options
    const allGroups = await repo.listGroups();
    const allOptions = await repo.listOptions();

    // Map options to all groups
    const fullGroups = allGroups.map((g) => {
      const opts = allOptions.filter((o) => o.group_id === g.id);
      return {
        ...g,
        options: opts,
      };
    });

    // Structure assigned groups
    const assigned = assignedGroups.map((g) => {
      const opts = allOptions
        .filter((o) => o.group_id === g.id && assignedOptionIds.has(o.id));
      return {
        ...g,
        assigned_option_ids: opts.map((o) => o.id),
        options: opts,
      };
    });

    return {
      category_id: catId,
      assigned_groups: assigned,
      all_groups: fullGroups,
    };
  } catch (err) {
    wrap('getCategorySpecifications', err);
  }
}

export async function saveCategorySpecifications(actor, categoryId, body) {
  try {
    const catId = Number(categoryId);
    const groups = Array.isArray(body?.groups) ? body.groups : [];

    await repo.saveCategorySpecifications(catId, groups);

    await writeAudit({
      actorId: actor?.id,
      action: 'category_specs.saved',
      entityType: 'category',
      entityId: catId,
      newValues: { groups_count: groups.length },
    });

    return await getCategorySpecifications(catId);
  } catch (err) {
    wrap('saveCategorySpecifications', err);
  }
}

export async function presetCategorySpecifications(actor, categoryId, { preset } = {}) {
  try {
    const catId = Number(categoryId);

    // Ensure standard groups exist
    async function ensureGroup(code, name, options = []) {
      let g = await repo.findGroupByCode(code);
      if (!g) {
        g = await repo.createGroup({
          code,
          name,
          input_type: 'select',
          is_required: true,
        });
      }
      const existingOpts = await repo.listOptions({ groupId: g.id });
      for (const opt of options) {
        const optCode = codeify(opt);
        if (!existingOpts.some((o) => o.code === optCode)) {
          await repo.createOption({
            group_id: g.id,
            code: optCode,
            name: opt,
          });
        }
      }
      const updatedOpts = await repo.listOptions({ groupId: g.id });
      return { group: g, options: updatedOpts };
    }

    const collar = await ensureGroup('collar', 'Collar Style', ['Normal Collar', 'Chinese Collar', 'Button Down', 'Mandarin Collar']);
    const button = await ensureGroup('button', 'Button Type', ['Normal Button', 'Press Button', 'Wooden Button', 'Hidden Button']);
    const sleeve = await ensureGroup('sleeve', 'Sleeve Length', ['Full Sleeve', 'Half Sleeve', 'Roll-up Sleeve', 'Sleeveless']);
    const fit = await ensureGroup('fit', 'Fit Type', ['Slim Fit', 'Regular Fit', 'Relaxed Fit', 'Tailored Fit']);
    const size = await ensureGroup('size', 'Size', ['S', 'M', 'L', 'XL', 'XXL']);

    // Standard shirt/apparel preset
    const groupsToAssign = [
      {
        group_id: collar.group.id,
        sort_order: 1,
        is_required: true,
        option_ids: collar.options.map((o) => o.id),
      },
      {
        group_id: button.group.id,
        sort_order: 2,
        is_required: true,
        option_ids: button.options.map((o) => o.id),
      },
      {
        group_id: sleeve.group.id,
        sort_order: 3,
        is_required: true,
        option_ids: sleeve.options.map((o) => o.id),
      },
      {
        group_id: fit.group.id,
        sort_order: 4,
        is_required: true,
        option_ids: fit.options.map((o) => o.id),
      },
      {
        group_id: size.group.id,
        sort_order: 5,
        is_required: true,
        option_ids: size.options.map((o) => o.id),
      },
    ];

    await repo.saveCategorySpecifications(catId, groupsToAssign);

    await writeAudit({
      actorId: actor?.id,
      action: 'category_specs.preset_applied',
      entityType: 'category',
      entityId: catId,
      newValues: { preset: preset || 'apparel_standard' },
    });

    return await getCategorySpecifications(catId);
  } catch (err) {
    wrap('presetCategorySpecifications', err);
  }
}

export default {
  listGroups,
  getGroup,
  createGroup,
  updateGroup,
  listOptions,
  createOption,
  updateOption,
  validateOptionSet,
  getCategorySpecifications,
  saveCategorySpecifications,
  presetCategorySpecifications,
  codeify,
};

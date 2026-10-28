import db from '../../db/knex.js';

// ----- Groups -----
export async function listGroups() {
  return db('specification_groups').orderBy('sort_order', 'asc').orderBy('id', 'asc');
}

export async function findGroupById(id) {
  return db('specification_groups').where({ id }).first();
}

export async function findGroupByCode(code) {
  return db('specification_groups').where({ code }).first();
}

export async function createGroup(data) {
  const [id] = await db('specification_groups').insert({
    code: data.code,
    name: data.name,
    description: data.description ?? null,
    input_type: data.input_type || 'select',
    is_required: data.is_required !== false,
    sort_order: data.sort_order ?? 0,
    created_at: db.fn.now(),
    updated_at: db.fn.now(),
  });
  return findGroupById(id);
}

export async function updateGroup(id, data) {
  const patch = { updated_at: db.fn.now() };
  for (const key of ['name', 'description', 'input_type', 'is_required', 'sort_order']) {
    if (data[key] !== undefined) patch[key] = data[key];
  }
  // code is immutable after create to avoid breaking product links
  await db('specification_groups').where({ id }).update(patch);
  return findGroupById(id);
}

export async function countOptionsInGroup(groupId) {
  const [{ total }] = await db('specification_options')
    .where({ group_id: groupId })
    .count({ total: '*' });
  return Number(total);
}

// ----- Options -----
export async function listOptions({ groupId, status } = {}) {
  let q = db('specification_options as o')
    .join('specification_groups as g', 'g.id', 'o.group_id')
    .select(
      'o.id',
      'o.group_id',
      'o.code',
      'o.name',
      'o.metadata',
      'o.sort_order',
      'o.status',
      'g.code as group_code',
      'g.name as group_name'
    )
    .orderBy('g.sort_order', 'asc')
    .orderBy('o.sort_order', 'asc');

  if (groupId) q = q.where('o.group_id', groupId);
  if (status) q = q.where('o.status', status);
  return q;
}

export async function findOptionById(id) {
  return db('specification_options').where({ id }).first();
}

export async function findOptionByGroupAndCode(groupId, code) {
  return db('specification_options').where({ group_id: groupId, code }).first();
}

export async function createOption(data) {
  const [id] = await db('specification_options').insert({
    group_id: data.group_id,
    code: data.code,
    name: data.name,
    metadata: data.metadata ? JSON.stringify(data.metadata) : null,
    sort_order: data.sort_order ?? 0,
    status: data.status || 'active',
    created_at: db.fn.now(),
    updated_at: db.fn.now(),
  });
  return findOptionById(id);
}

export async function updateOption(id, data) {
  const patch = { updated_at: db.fn.now() };
  for (const key of ['name', 'sort_order', 'status']) {
    if (data[key] !== undefined) patch[key] = data[key];
  }
  if (data.metadata !== undefined) {
    patch.metadata = data.metadata ? JSON.stringify(data.metadata) : null;
  }
  await db('specification_options').where({ id }).update(patch);
  return findOptionById(id);
}

export async function findOptionsByIds(ids) {
  if (!ids.length) return [];
  return db('specification_options as o')
    .join('specification_groups as g', 'g.id', 'o.group_id')
    .whereIn('o.id', ids)
    .select(
      'o.id',
      'o.group_id',
      'o.code',
      'o.name',
      'o.metadata',
      'o.status',
      'g.code as group_code',
      'g.name as group_name',
      'g.is_required as group_required'
    );
}

// ----- Category Specifications -----
export async function getCategorySpecificationGroups(categoryId) {
  return db('category_specification_groups as csg')
    .join('specification_groups as g', 'g.id', 'csg.group_id')
    .where('csg.category_id', categoryId)
    .select(
      'g.id',
      'g.code',
      'g.name',
      'g.description',
      'g.input_type',
      'csg.sort_order',
      'csg.is_required'
    )
    .orderBy('csg.sort_order', 'asc');
}

export async function getCategorySpecificationOptionIds(categoryId) {
  const rows = await db('category_specification_options')
    .where('category_id', categoryId)
    .select('option_id');
  return rows.map((r) => Number(r.option_id));
}

export async function saveCategorySpecifications(categoryId, groupsWithOptionIds) {
  return db.transaction(async (trx) => {
    await trx('category_specification_groups').where('category_id', categoryId).delete();
    await trx('category_specification_options').where('category_id', categoryId).delete();

    for (let i = 0; i < groupsWithOptionIds.length; i++) {
      const g = groupsWithOptionIds[i];
      await trx('category_specification_groups').insert({
        category_id: categoryId,
        group_id: g.group_id,
        sort_order: g.sort_order !== undefined ? g.sort_order : i,
        is_required: g.is_required !== false,
      });

      if (Array.isArray(g.option_ids) && g.option_ids.length > 0) {
        for (const optId of g.option_ids) {
          await trx('category_specification_options').insert({
            category_id: categoryId,
            option_id: optId,
          });
        }
      }
    }
  });
}

export default {
  listGroups,
  findGroupById,
  findGroupByCode,
  createGroup,
  updateGroup,
  countOptionsInGroup,
  listOptions,
  findOptionById,
  findOptionByGroupAndCode,
  createOption,
  updateOption,
  findOptionsByIds,
  getCategorySpecificationGroups,
  getCategorySpecificationOptionIds,
  saveCategorySpecifications,
};

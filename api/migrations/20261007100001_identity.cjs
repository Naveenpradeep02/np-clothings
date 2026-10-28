/**
 * Identity & Access: users, roles, permissions, profiles, addresses
 */

/** @param {import('knex').Knex} knex */
exports.up = async function up(knex) {
  await knex.schema.createTable("users", (t) => {
    t.bigIncrements("id").unsigned().primary();
    t.string("firebase_uid", 128).notNullable();
    t.string("email", 255).notNullable();
    t.boolean("email_verified").notNullable().defaultTo(false);
    t.string("phone", 32).nullable();
    t.enum("user_type", ["customer", "employee"])
      .notNullable()
      .defaultTo("customer");
    t.enum("status", ["active", "inactive", "suspended", "deleted"])
      .notNullable()
      .defaultTo("active");
    t.dateTime("last_login_at").nullable();
    t.timestamps(true, true);
    t.dateTime("deleted_at").nullable();
    t.unique(["firebase_uid"], { indexName: "uq_users_firebase_uid" });
    t.unique(["email"], { indexName: "uq_users_email" });
    t.index(["user_type", "status"], "idx_users_type_status");
    t.index(["deleted_at"], "idx_users_deleted");
  });

  await knex.schema.createTable("roles", (t) => {
    t.bigIncrements("id").unsigned().primary();
    t.string("code", 64).notNullable();
    t.string("name", 128).notNullable();
    t.string("description", 512).nullable();
    t.boolean("is_system").notNullable().defaultTo(false);
    t.timestamps(true, true);
    t.unique(["code"], { indexName: "uq_roles_code" });
  });

  await knex.schema.createTable("permissions", (t) => {
    t.bigIncrements("id").unsigned().primary();
    t.string("code", 128).notNullable();
    t.string("name", 128).notNullable();
    t.string("module", 64).notNullable();
    t.string("description", 512).nullable();
    t.timestamp("created_at").defaultTo(knex.fn.now());
    t.unique(["code"], { indexName: "uq_permissions_code" });
    t.index(["module"], "idx_permissions_module");
  });

  await knex.schema.createTable("role_permissions", (t) => {
    t.bigInteger("role_id").unsigned().notNullable();
    t.bigInteger("permission_id").unsigned().notNullable();
    t.timestamp("created_at").defaultTo(knex.fn.now());
    t.primary(["role_id", "permission_id"]);
    t.foreign("role_id").references("roles.id").onDelete("CASCADE");
    t.foreign("permission_id").references("permissions.id").onDelete("CASCADE");
  });

  await knex.schema.createTable("user_roles", (t) => {
    t.bigInteger("user_id").unsigned().notNullable();
    t.bigInteger("role_id").unsigned().notNullable();
    t.bigInteger("assigned_by").unsigned().nullable();
    t.timestamp("created_at").defaultTo(knex.fn.now());
    t.primary(["user_id", "role_id"]);
    t.foreign("user_id").references("users.id").onDelete("CASCADE");
    t.foreign("role_id").references("roles.id").onDelete("CASCADE");
    t.foreign("assigned_by").references("users.id").onDelete("SET NULL");
  });

  await knex.schema.createTable("customer_profiles", (t) => {
    t.bigIncrements("id").unsigned().primary();
    t.bigInteger("user_id").unsigned().notNullable();
    t.string("first_name", 100).nullable();
    t.string("last_name", 100).nullable();
    t.string("display_name", 150).nullable();
    t.date("date_of_birth").nullable();
    t.enum("gender", ["male", "female", "other", "prefer_not"]).nullable();
    t.string("avatar_url", 512).nullable();
    t.timestamps(true, true);
    t.unique(["user_id"], { indexName: "uq_customer_profiles_user" });
    t.foreign("user_id").references("users.id").onDelete("CASCADE");
  });

  await knex.schema.createTable("employee_profiles", (t) => {
    t.bigIncrements("id").unsigned().primary();
    t.bigInteger("user_id").unsigned().notNullable();
    t.string("first_name", 100).notNullable();
    t.string("last_name", 100).notNullable();
    t.string("employee_code", 32).nullable();
    t.string("department", 100).nullable();
    t.string("job_title", 100).nullable();
    t.string("avatar_url", 512).nullable();
    t.date("hired_at").nullable();
    t.timestamps(true, true);
    t.unique(["user_id"], { indexName: "uq_employee_profiles_user" });
    t.unique(["employee_code"], { indexName: "uq_employee_code" });
    t.foreign("user_id").references("users.id").onDelete("CASCADE");
  });

  await knex.schema.createTable("addresses", (t) => {
    t.bigIncrements("id").unsigned().primary();
    t.bigInteger("user_id").unsigned().notNullable();
    t.string("label", 50).nullable();
    t.string("full_name", 150).notNullable();
    t.string("phone", 32).notNullable();
    t.string("line1", 255).notNullable();
    t.string("line2", 255).nullable();
    t.string("city", 100).notNullable();
    t.string("state", 100).notNullable();
    t.string("postal_code", 20).notNullable();
    t.string("country_code", 2).notNullable().defaultTo("IN");
    t.boolean("is_default").notNullable().defaultTo(false);
    t.timestamps(true, true);
    t.dateTime("deleted_at").nullable();
    t.index(["user_id"], "idx_addresses_user");
    t.index(["user_id", "is_default"], "idx_addresses_default");
    t.foreign("user_id").references("users.id").onDelete("CASCADE");
  });
};

/** @param {import('knex').Knex} knex */
exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists("addresses");
  await knex.schema.dropTableIfExists("employee_profiles");
  await knex.schema.dropTableIfExists("customer_profiles");
  await knex.schema.dropTableIfExists("user_roles");
  await knex.schema.dropTableIfExists("role_permissions");
  await knex.schema.dropTableIfExists("permissions");
  await knex.schema.dropTableIfExists("roles");
  await knex.schema.dropTableIfExists("users");
};

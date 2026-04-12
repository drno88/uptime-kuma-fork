exports.up = async function (knex) {
    // Add role column to user table (admin or user)
    await knex.schema.alterTable("user", function (table) {
        table.string("role", 20).notNullable().defaultTo("user");
    });

    // Set the first user (id=1) as admin
    await knex("user").where("id", 1).update({ role: "admin" });

    // Create monitor_access table for selective sharing
    await knex.schema.createTable("monitor_access", function (table) {
        table.increments("id");
        table.integer("monitor_id").unsigned().references("id").inTable("monitor").onDelete("CASCADE").onUpdate("CASCADE");
        table.integer("user_id").unsigned().references("id").inTable("user").onDelete("CASCADE").onUpdate("CASCADE");
        table.unique(["monitor_id", "user_id"]);
    });
};

exports.down = async function (knex) {
    await knex.schema.dropTableIfExists("monitor_access");
    await knex.schema.alterTable("user", function (table) {
        table.dropColumn("role");
    });
};

exports.up = function (knex) {
    return knex.schema.alterTable("status_page", function (table) {
        table.string("visibility", 20).notNullable().defaultTo("public");
    });
};

exports.down = function (knex) {
    return knex.schema.alterTable("status_page", function (table) {
        table.dropColumn("visibility");
    });
};

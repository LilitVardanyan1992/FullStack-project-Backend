"use strict";

/**
 * company controller
 */

const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController("api::company.company", ({ strapi }) => ({
  async create(ctx) {
    const result = await strapi
      .service("api::company.company")
      .createChange(ctx);

    return ctx.send(result);
  },
}));

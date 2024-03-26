"use strict";

/**
 * company service
 */

const { createCoreService } = require("@strapi/strapi").factories;
const Outscraper = require("outscraper");

module.exports = createCoreService("api::company.company", ({ strapi }) => ({
  async createChange(...args) {
    const ctx = strapi.requestContext.get();
    const user = ctx.state.user;
    console.log(user.id);
    const { companyName, companyAddress } = ctx.request.body.data; //Can't resolve this error, but it does not interfere with work
    console.log(companyAddress, companyName);

    let client = new Outscraper(process.env.OUTSCRAPER_API_KEY);
    let reviewsLimit = 50;
    let sort;
    let newest;
    try {
      const response = await client.googleMapsReviews(
        [`${companyName} ${companyAddress}`],
        reviewsLimit,
        (sort = newest)
      );

      if (
        response &&
        response.length &&
        response[0].reviews_data &&
        response[0].reviews_data.length
      ) {
        const resultCompany = await strapi.db
          .query("api::company.company")
          .create({
            data: {
              companyName: response[0].name,
              companyAddress: response[0].full_address,
              user: user.id,
            },
          });

        const queryCompany = {
          where: {
            id: resultCompany.id,
          },
          data: {
            publishedAt: new Date().toISOString(),
          },
        };

        await strapi.db.query("api::company.company").update(queryCompany);

        response[0].reviews_data.forEach(async (item) => {
          const {
            author_title,
            review_text,
            author_image,
            review_datetime_utc,
            review_rating,
          } = item;

          const reviewDate = new Date(review_datetime_utc);
          const isoDateString = reviewDate.toISOString();
          const resultGoogleReview = await strapi.db
            .query("api::google-review.google-review")
            .create({
              data: {
                company: resultCompany.id,
                author_title: author_title,
                review_text: review_text,
                review_datetime_utc: isoDateString,
                author_image: author_image,
                review_rating: review_rating,
              },
            });

          const queryGoogleReview = {
            where: {
              id: resultGoogleReview.id,
            },
            data: {
              publishedAt: new Date().toISOString(),
            },
          };

          await strapi.db
            .query("api::google-review.google-review")
            .update(queryGoogleReview);
        });

        return { success: "success" };
      } else {
        return "Don't have review data appropriate provided";
      }
    } catch (error) {
      console.error("Error:", error);
      throw error;
    }
  },
}));

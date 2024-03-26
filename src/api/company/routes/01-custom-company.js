module.exports = {
  routes: [
    {
      method: "POST",
      path: "/companies",
      handler: "company.create",
    },
  ],
};

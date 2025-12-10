const isProd = process.env.NODE_ENV === "production";
/** @type {import("postcss-load-config").Config} */
module.exports = {
  plugins: {
    "tailwindcss/nesting": {},
    tailwindcss: {},
    autoprefixer: {},
    ...(isProd ? { cssnano: { preset: "default" } } : {}),
  },
};

module.exports = {
  content: ["./src/**/*.{njk,html,md,js}"],
  theme: {
    extend: {
      colors: {
        "av-gold": "#D4AF37",
        "av-gold-light": "#CFB53B",
        "av-gold-dark": "#B8962E",
        "av-dark": "#1A1A1A",
        "av-dark-light": "#2C2C2C"
      },
      fontFamily: {
        display: ["Playfair Display", "serif"],
        body: ["Source Sans 3", "sans-serif"]
      }
    }
  },
  plugins: []
};

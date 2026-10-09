/**
 * Marketing-site prices. Basic is Option B: $1.99/mo or $19/yr.
 *
 * showFounderBanner is the only switch for the Founder Lifetime banner,
 * its FAQ, and its JSON-LD offer. Set it to false when the 100 spots
 * are gone or after the close date. Do not add a live spots counter.
 */
module.exports = {
  showFounderBanner: true,
  founderUrl: "https://app.arsenalvault.com/pricing#founder",
  founderCloseDate: "Dec 31, 2026",
  founderPrice: "79",
  yearlySavingsLabel: "save up to 20%",
  basic: { monthly: "1.99", yearly: "19", note: "save 20%" },
  pro: { monthly: "5.99", yearly: "59", note: "2 months free" },
  ultimate: { monthly: "12.99", yearly: "129", note: "2 months free" },
  privateVault: { monthly: "3", yearly: "29" },
  desktop: {
    basic: "44.99",
    pro: "89.99",
    ultimate: "179.99"
  }
};

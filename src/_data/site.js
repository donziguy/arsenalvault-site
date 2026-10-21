const ga4Id = "G-652RBNGMD2";
// Google Ads conversion action "AV Sign-up". The app sends this conversion
// after registration. This site loads the tag and links the two domains.
const googleAdsId = "AW-18064652064";
const googleAdsConversionLabel = "xw8jCPOQ8aMdEKDu8qVD";
const googleAdsSendTo = "AW-18064652064/xw8jCPOQ8aMdEKDu8qVD";
const linkerDomains = ["arsenalvault.com", "app.arsenalvault.com"];

module.exports = {
  name: "Arsenal Vault",
  url: "https://arsenalvault.com",
  description: "Secure firearms inventory software for hosted cloud and Windows desktop, with encrypted vaults, reports, photos, ammunition, parts, and maintenance tracking.",
  defaultImage: "https://arsenalvault.com/img/av-shield-512.png",
  gtagId: ga4Id,
  umamiId: "91ad2fc0-3ac6-4c85-8532-795652377dc7",
  tracking: {
    ga4Id,
    googleAdsId,
    googleAdsConversionLabel,
    googleAdsSendTo,
    linkerDomains
  }
};

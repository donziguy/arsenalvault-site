function fromEnv(name, fallback) {
  const value = (process.env[name] || "").trim();
  return value || fallback;
}

const ga4Id = "G-652RBNGMD2";
const googleAdsId = fromEnv("GOOGLE_ADS_ID", "AW-XXXXXXXXXX");
const googleAdsConversionLabel = fromEnv("GOOGLE_ADS_CONVERSION_LABEL", "XXXXXXXXXX");
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
    linkerDomains
  }
};

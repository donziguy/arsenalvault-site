const pricing = require("./pricing");

const OFFER_URL = "https://arsenalvault.com/pricing";
const AVAILABILITY = "https://schema.org/InStock";

function offer(name, price) {
  const text = String(price);
  if (!/^\d+(\.\d+)?$/.test(text)) {
    throw new Error(`Invalid SoftwareApplication offer price for ${name}: ${text}`);
  }
  return {
    "@type": "Offer",
    name,
    price: JSON.parse(text),
    priceCurrency: "USD",
    availability: AVAILABILITY,
    url: OFFER_URL
  };
}

function offersFromPricing(source) {
  const offers = [
    offer("Free", source.free),
    offer("Basic monthly", source.basic.monthly),
    offer("Basic yearly", source.basic.yearly),
    offer("Pro monthly", source.pro.monthly),
    offer("Pro yearly", source.pro.yearly),
    offer("Ultimate monthly", source.ultimate.monthly),
    offer("Ultimate yearly", source.ultimate.yearly),
    offer("Private Vault monthly", source.privateVault.monthly),
    offer("Private Vault yearly", source.privateVault.yearly),
    offer("Desktop Basic yearly", source.desktop.basic),
    offer("Desktop Pro yearly", source.desktop.pro),
    offer("Desktop Ultimate yearly", source.desktop.ultimate)
  ];
  if (source.showFounderBanner) {
    offers.push(offer("Founder Lifetime", source.founderPrice));
  }
  return offers;
}

module.exports = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Arsenal Vault",
  description: "Serials, photos, and values in one private vault. Free Forever for up to 5 firearms, with CSV ready for a claim. PDF insurance reports are Pro and Ultimate.",
  applicationCategory: "LifestyleApplication",
  operatingSystem: "Web, Windows",
  url: "https://arsenalvault.com/",
  publisher: {
    "@type": "Organization",
    name: "Arsenal Vault",
    url: "https://arsenalvault.com",
    address: {
      "@type": "PostalAddress",
      streetAddress: "686 RD 660",
      addressLocality: "Dayton",
      addressRegion: "TX",
      postalCode: "77535",
      addressCountry: "US"
    }
  },
  offers: offersFromPricing(pricing)
};

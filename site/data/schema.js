/*
  THE CREATIVE VAULT V2 CLIENT SCHEMA

  This keeps older resource files working while supporting the newer cross-category model.
*/

const vaultSchemaVersion = "2.0-cross-category";

const vaultResourceSchema = {
  identity: [
    "id",
    "title",
    "shortName",
    "company",
    "companyWebsite",
    "website",
    "logo",
    "favicon",
    "heroImage",
    "screenshots"
  ],

  classification: [
    "primaryCategory",
    "primaryCategoryId",
    "category",
    "categoryId",
    "categories",
    "categoryIds",
    "subcategories",
    "type",
    "industries",
    "creativeFields",
    "useCases",
    "tags",
    "collections"
  ],

  description: [
    "shortDescription",
    "longDescription",
    "whyUseIt",
    "bestFor",
    "pros",
    "cons",
    "notes"
  ],

  compatibility: [
    "platforms",
    "operatingSystems",
    "mobileSupport",
    "browserSupport",
    "offline",
    "cloudSync",
    "fileFormats",
    "integrations",
    "api",
    "plugins",
    "extensions",
    "ai"
  ],

  pricing: [
    "price",
    "pricingModel",
    "pricingDetails",
    "freeTrial",
    "studentDiscount",
    "commercialUse",
    "license",
    "licenseType"
  ],

  quality: [
    "rating",
    "popularity",
    "beginnerFriendly",
    "professional",
    "learningCurve",
    "industryStandard",
    "openSource",
    "verified",
    "lastReviewed"
  ],

  discovery: [
    "alternatives",
    "competitors",
    "related",
    "tutorials",
    "youtubeChannels",
    "documentation",
    "community",
    "discord",
    "reddit",
    "github",
    "twitter",
    "instagram"
  ],

  metadata: [
    "featured",
    "editorPick",
    "dateAdded",
    "submittedBy"
  ]
};

function uniqueValues(items) {
  return [...new Set((items || []).filter(Boolean).map(item => String(item).trim()).filter(Boolean))];
}

function slugifyClient(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function upgradeResource(resource) {
  const platforms = resource.platforms || resource.operatingSystems || [];
  const primaryCategory = resource.primaryCategory || resource.category || "Resources";
  const categories = uniqueValues([
    primaryCategory,
    resource.category,
    ...(resource.categories || []),
    ...(resource.creativeFields || [])
  ]);

  return {
    id: resource.id || "",
    title: resource.title || "",
    shortName: resource.shortName || resource.title || "",
    company: resource.company || "",
    companyWebsite: resource.companyWebsite || "",
    website: resource.website || "",
    logo: resource.logo || "",
    favicon: resource.favicon || "",
    heroImage: resource.heroImage || resource.screenshot || "",
    screenshots: resource.screenshots || [],

    primaryCategory,
    primaryCategoryId: resource.primaryCategoryId || resource.categoryId || slugifyClient(primaryCategory),
    category: primaryCategory,
    categoryId: resource.primaryCategoryId || resource.categoryId || slugifyClient(primaryCategory),
    categories,
    categoryIds: resource.categoryIds || categories.map(slugifyClient),
    subcategories: resource.subcategories || [],
    type: resource.type || "Resource",
    industries: resource.industries || [],
    creativeFields: resource.creativeFields || [],
    useCases: resource.useCases || resource.bestFor || [],
    tags: resource.tags || [],
    collections: resource.collections || [],

    shortDescription: resource.shortDescription || resource.description || "",
    longDescription: resource.longDescription || resource.description || resource.shortDescription || "",
    whyUseIt: resource.whyUseIt || "",
    bestFor: resource.bestFor || [],
    pros: resource.pros || [],
    cons: resource.cons || [],
    notes: resource.notes || "",

    platforms: platforms,
    operatingSystems: resource.operatingSystems || platforms,
    mobileSupport: resource.mobileSupport ?? platforms.some(platform => ["iPad", "iPhone", "Android"].includes(platform)),
    browserSupport: resource.browserSupport ?? platforms.includes("Browser"),
    offline: resource.offline ?? false,
    cloudSync: resource.cloudSync ?? false,
    fileFormats: resource.fileFormats || [],
    integrations: resource.integrations || [],
    api: resource.api ?? false,
    plugins: resource.plugins ?? false,
    extensions: resource.extensions ?? false,
    ai: resource.ai ?? (categories.includes("AI Tools") || resource.categoryId === "ai-tools"),

    price: resource.price || "Unknown",
    pricingModel: resource.pricingModel || resource.price || "Unknown",
    pricingDetails: resource.pricingDetails || "",
    freeTrial: resource.freeTrial ?? false,
    studentDiscount: resource.studentDiscount ?? false,
    commercialUse: resource.commercialUse ?? null,
    license: resource.license || "",
    licenseType: resource.licenseType || "",

    rating: Number(resource.rating || 0),
    popularity: Number(resource.popularity || 0),
    beginnerFriendly: resource.beginnerFriendly ?? false,
    professional: resource.professional ?? (String(resource.skillLevel || "").includes("Professional")),
    learningCurve: resource.learningCurve || resource.skillLevel || "Not listed",
    industryStandard: resource.industryStandard ?? false,
    openSource: resource.openSource ?? false,
    verified: resource.verified ?? true,
    lastReviewed: resource.lastReviewed || "2026-07-08",

    alternatives: resource.alternatives || [],
    competitors: resource.competitors || [],
    related: resource.related || [],
    tutorials: resource.tutorials || [],
    youtubeChannels: resource.youtubeChannels || [],
    documentation: resource.documentation || "",
    community: resource.community || "",
    discord: resource.discord || "",
    reddit: resource.reddit || "",
    github: resource.github || "",
    twitter: resource.twitter || "",
    instagram: resource.instagram || "",

    featured: resource.featured ?? false,
    editorPick: resource.editorPick ?? resource.editorsPick ?? false,
    dateAdded: resource.dateAdded || "2026-07-08",
    submittedBy: resource.submittedBy || "Ellis Ricketts",
    sourceFile: resource.sourceFile || ""
  };
}

function upgradeResources(resourceList) {
  return resourceList.map(upgradeResource);
}

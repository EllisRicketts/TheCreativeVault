#!/usr/bin/env node

/**
 * Creative Vault Safe Recursive Compiler
 * Version: V34
 *
 * What this does:
 * - Recursively scans database/resources recursively
 * - Accepts JSON files that contain either:
 *   1) one resource object
 *   2) an array of resource objects
 *   3) an object with a resources array
 * - Merges duplicate resources by id/title/website
 * - Normalizes missing category fields
 * - Preserves your current generated-resources.js assignment format
 * - Refuses to overwrite the generated index if the compile result is 0
 *
 * Run from the project root:
 *   node tools/compile-database.js
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const RESOURCES_DIR = path.join(ROOT, "database", "resources");
const V35_ADDITIONAL_DATABASE_DIRS = [
  path.join(ROOT, "database", "software"),
  path.join(ROOT, "database", "companies"),
  path.join(ROOT, "database", "applications")
];
const DATA_DIR = path.join(ROOT, "data");
const OUT_FILE = path.join(DATA_DIR, "generated-resources.js");
const REPORT_FILE = path.join(DATA_DIR, "compile-report.json");

const GENERATED_PREFIX = "const generatedResources = ";
const GENERATED_SUFFIX = ";\n";

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function readJson(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new Error(`${filePath}: ${error.message}`);
  }
}

function walkJsonFiles(dir) {
  if (!fs.existsSync(dir)) return [];

  const output = [];

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      output.push(...walkJsonFiles(full));
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".json")) {
      output.push(full);
    }
  }

  return output.sort();
}

function flattenResourceFile(parsed, filePath) {
  if (Array.isArray(parsed)) return parsed;

  if (
    parsed &&
    Array.isArray(parsed.resources) &&
    parsed.resources.every(item => item && typeof item === "object" && !Array.isArray(item))
  ) {
    return parsed.resources;
  }

  if (parsed && typeof parsed === "object") return [parsed];

  throw new Error(`${filePath}: Unsupported JSON resource shape`);
}

function inferCategoryFromPath(filePath) {
  let rel;
  if (filePath.startsWith(RESOURCES_DIR)) {
    rel = path.relative(RESOURCES_DIR, filePath).split(path.sep);
  } else {
    rel = path.relative(path.join(ROOT, "database"), filePath).split(path.sep);
  }
  if (!rel.length) return "Resources";

  const first = rel[0].replace(/\.json$/i, "");
  return first
    .split("-")
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ") || "Resources";
}

function normalizeArray(value) {
  if (Array.isArray(value)) return value.filter(Boolean).map(String);
  if (value === undefined || value === null || value === "") return [];
  return [String(value)];
}

function normalizeResource(resource, filePath, index) {
  if (!resource || typeof resource !== "object" || Array.isArray(resource)) {
    throw new Error(`${filePath} resource #${index + 1} is not an object`);
  }

  const normalized = { ...resource };

  normalized.title = normalized.title || normalized.name || normalized.shortName;
  if (!normalized.title) {
    throw new Error(`${filePath} resource #${index + 1} is missing title`);
  }

  normalized.website = normalized.website || normalized.url || normalized.link || "";
  normalized.company = normalized.company || normalized.publisher || normalized.creator || "";

  const inferredCategory = inferCategoryFromPath(filePath);
  normalized.category = normalized.category || normalized.primaryCategory || inferredCategory;
  normalized.categoryId = normalized.categoryId || slugify(normalized.category);

  normalized.categories = normalizeArray(normalized.categories);
  if (normalized.category && !normalized.categories.includes(normalized.category)) {
    normalized.categories.unshift(normalized.category);
  }

  normalized.categoryIds = normalizeArray(normalized.categoryIds);
  if (normalized.categoryId && !normalized.categoryIds.includes(normalized.categoryId)) {
    normalized.categoryIds.unshift(normalized.categoryId);
  }

  normalized.primaryCategory = normalized.primaryCategory || normalized.category;

  normalized.subcategories = normalizeArray(normalized.subcategories);
  normalized.tags = normalizeArray(normalized.tags);

  normalized.shortDescription =
    normalized.shortDescription ||
    normalized.description ||
    normalized.longDescription ||
    "";

  normalized.longDescription =
    normalized.longDescription ||
    normalized.description ||
    normalized.shortDescription ||
    "";

  normalized.price = normalized.price || normalized.pricing || normalized.pricingModel || "Unknown";
  normalized.pricingModel = normalized.pricingModel || normalized.price;

  normalized.platforms = normalizeArray(normalized.platforms);
  if (!normalized.platforms.length) normalized.platforms = ["Browser"];

  normalized.bestFor = normalizeArray(normalized.bestFor);

  normalized.type = normalized.type || "Resource";
  normalized.verified = normalized.verified !== false;
  normalized.featured = Boolean(normalized.featured);
  normalized.editorPick = Boolean(normalized.editorPick);
  normalized.lastReviewed = normalized.lastReviewed || new Date().toISOString().slice(0, 10);

  normalized.id =
    normalized.id ||
    slugify([
      normalized.categoryId,
      normalized.company,
      normalized.title,
      normalized.website
    ].filter(Boolean).join("-"));

  return normalized;
}

function dedupeKey(resource) {
  if (resource.id) return `id:${String(resource.id).toLowerCase()}`;
  if (resource.website) return `url:${String(resource.website).toLowerCase().replace(/\/$/, "")}`;
  return `title:${String(resource.title).toLowerCase()}`;
}

function mergeResource(existing, incoming) {
  return {
    ...existing,
    ...incoming,
    categories: Array.from(new Set([...(existing.categories || []), ...(incoming.categories || [])])),
    categoryIds: Array.from(new Set([...(existing.categoryIds || []), ...(incoming.categoryIds || [])])),
    subcategories: Array.from(new Set([...(existing.subcategories || []), ...(incoming.subcategories || [])])),
    tags: Array.from(new Set([...(existing.tags || []), ...(incoming.tags || [])])),
    platforms: Array.from(new Set([...(existing.platforms || []), ...(incoming.platforms || [])])),
    bestFor: Array.from(new Set([...(existing.bestFor || []), ...(incoming.bestFor || [])]))
  };
}

function extractExistingCount() {
  if (!fs.existsSync(OUT_FILE)) return 0;

  const text = fs.readFileSync(OUT_FILE, "utf8");
  const match = text.match(/(?:const|let|var)\s+generatedResources\s*=\s*(\[[\s\S]*?\])\s*;?\s*$/)
    || text.match(/window\.generatedResources\s*=\s*(\[[\s\S]*?\])\s*;?\s*$/);

  if (!match) return 0;

  try {
    return JSON.parse(match[1]).length;
  } catch (error) {
    return 0;
  }
}

function main() {
  const started = new Date().toISOString();
  const files = [
    ...walkJsonFiles(RESOURCES_DIR),
    ...V35_ADDITIONAL_DATABASE_DIRS.flatMap(dir => walkJsonFiles(dir))
  ].sort();
  const byKey = new Map();
  const errors = [];
  const warnings = [];

  for (const file of files) {
    try {
      const parsed = readJson(file);
      const resources = flattenResourceFile(parsed, file);

      resources.forEach((resource, index) => {
        try {
          const normalized = normalizeResource(resource, file, index);
          const key = dedupeKey(normalized);

          if (byKey.has(key)) {
            byKey.set(key, mergeResource(byKey.get(key), normalized));
            warnings.push(`Duplicate merged: ${normalized.title} from ${path.relative(ROOT, file)}`);
          } else {
            byKey.set(key, normalized);
          }
        } catch (error) {
          errors.push(error.message);
        }
      });
    } catch (error) {
      errors.push(error.message);
    }
  }

  const resources = Array.from(byKey.values())
    .sort((a, b) => String(a.title || "").localeCompare(String(b.title || "")));

  const previousCount = extractExistingCount();

  const report = {
    version: "V34 safe recursive compiler",
    started,
    finished: new Date().toISOString(),
    filesScanned: files.length,
    resourceCount: resources.length,
    previousCount,
    errors,
    warnings: warnings.slice(0, 500)
  };

  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2), "utf8");

  if (errors.length) {
    console.error("\nCompile failed with errors:");
    errors.forEach(error => console.error(" - " + error));
    console.error(`\nReport written to: ${path.relative(ROOT, REPORT_FILE)}`);
    process.exit(1);
  }

  if (resources.length === 0) {
    console.error("\nREFUSING TO OVERWRITE generated-resources.js WITH 0 RESOURCES.");
    console.error("No valid resources were found in database/resources/.");
    console.error(`Report written to: ${path.relative(ROOT, REPORT_FILE)}`);
    process.exit(1);
  }

  if (previousCount > 0 && resources.length < Math.floor(previousCount * 0.5)) {
    console.error("\nREFUSING TO OVERWRITE generated-resources.js.");
    console.error(`New count (${resources.length}) is less than half of previous count (${previousCount}).`);
    console.error("This usually means files are missing or the resources folder is incomplete.");
    console.error(`Report written to: ${path.relative(ROOT, REPORT_FILE)}`);
    process.exit(1);
  }

  const output = GENERATED_PREFIX + JSON.stringify(resources, null, 2) + GENERATED_SUFFIX;
  fs.writeFileSync(OUT_FILE, output, "utf8");

  console.log("\nCreative Vault compile complete.");
  console.log(`Files scanned: ${files.length}`);
  console.log(`Resources: ${resources.length}`);
  console.log(`Output: ${path.relative(ROOT, OUT_FILE)}`);
  console.log(`Report: ${path.relative(ROOT, REPORT_FILE)}`);

  if (warnings.length) {
    console.log(`Warnings: ${warnings.length} duplicate/resource notices. See compile-report.json.`);
  }
}

main();

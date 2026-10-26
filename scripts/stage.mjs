// Usage: node scripts/stage.mjs <upstream-dir> <dist-dir> <version>
//
// Checks that every language the generator knows about produced a complete
// all.json, then copies them to <dist-dir>/<lang>.all.json together with
// version.txt. Exits non-zero (publishing nothing) if any language is missing,
// unparsable, or noticeably smaller than English.
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const MIN_RATIO_TO_ENGLISH = 0.95;

const [upstreamDir, distDir, version] = process.argv.slice(2);

if (!upstreamDir || !distDir || !version) {
    console.error("Usage: node scripts/stage.mjs <upstream-dir> <dist-dir> <version>");
    process.exit(1);
}

const { LANGUAGES_URL } = await import(pathToFileURL(path.resolve(upstreamDir, "constants.js")).href);
const folders = LANGUAGES_URL.map(language => language.folder);

const countEntries = folder => {
    const file = path.join(upstreamDir, "public", "api", folder, "all.json");
    if (!fs.existsSync(file)) {
        throw new Error(`${folder}: ${file} is missing`);
    }

    const data = JSON.parse(fs.readFileSync(file, "utf8"));
    if (!data || typeof data !== "object" || Array.isArray(data)) {
        throw new Error(`${folder}: all.json is not an object keyed by item id`);
    }

    return { file, count: Object.keys(data).length };
};

const errors = [];
const results = new Map();

for (const folder of folders) {
    try {
        results.set(folder, countEntries(folder));
    } catch (error) {
        errors.push(error.message);
    }
}

const englishCount = results.get("en")?.count ?? 0;
if (englishCount === 0) {
    errors.push("en: no entries, refusing to publish");
}

for (const [folder, { count }] of results) {
    console.log(`${folder.padEnd(6)} ${count}`);
    if (englishCount > 0 && count < englishCount * MIN_RATIO_TO_ENGLISH) {
        errors.push(`${folder}: ${count} entries is below ${MIN_RATIO_TO_ENGLISH * 100}% of en (${englishCount})`);
    }
}

if (errors.length > 0) {
    for (const message of errors) {
        console.error(`::error::${message}`);
    }
    process.exit(1);
}

fs.rmSync(distDir, { recursive: true, force: true });
fs.mkdirSync(distDir, { recursive: true });

for (const [folder, { file }] of results) {
    fs.copyFileSync(file, path.join(distDir, `${folder}.all.json`));
}
fs.writeFileSync(path.join(distDir, "version.txt"), `${version}\n`);

console.log(`Staged ${results.size} languages for version ${version}`);

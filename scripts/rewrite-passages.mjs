/**
 * One-shot: replace discover with two-paragraph passage on every content item.
 * Run: node scripts/rewrite-passages.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildPassage } from "../lib/passage.mjs";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

function escapeString(value) {
  return JSON.stringify(value);
}

function replaceDiscoverWithPassage(source, itemsById) {
  return source.replace(
    /discover:\s*\[[\s\S]*?\],\s*\n(\s*)followPrompt:/g,
    (match, indent, offset) => {
      const before = source.slice(0, offset);
      const idMatches = [...before.matchAll(/(?:^|\n) {4}id: "([^"]+)",/g)];
      const id = idMatches[idMatches.length - 1]?.[1];
      const item = itemsById.get(id);
      if (!item) {
        throw new Error(`Could not map discover block near id ${id || "?"}`);
      }
      const passage = buildPassage(item);
      return `passage: [\n${indent}  ${escapeString(passage[0])},\n${indent}  ${escapeString(passage[1])},\n${indent}],\n${indent}followPrompt:`;
    },
  );
}

async function rewrite(file, load) {
  const { items } = await load();
  const byId = new Map(items.map((item) => [item.id, item]));
  const full = path.join(root, file);
  const source = readFileSync(full, "utf8");
  const next = replaceDiscoverWithPassage(source, byId);
  if (next === source) throw new Error(`No discover blocks replaced in ${file}`);
  if (next.includes("discover:")) {
    const left = (next.match(/discover:/g) || []).length;
    throw new Error(`${file} still has ${left} discover: blocks`);
  }
  writeFileSync(full, next);
  console.log(`${file}: ${items.length} items rewritten`);
}

await rewrite("content/placement-check.mjs", () => import("../content/placement-check.mjs"));
await rewrite("content/modules.mjs", () => import("../content/modules.mjs"));
await rewrite("content/modules-part2.mjs", () => import("../content/modules-part2.mjs"));
console.log("done");

import fs from "node:fs";
import path from "node:path";

const SRC_DIR = path.resolve(process.cwd(), "src");
const ALLOWED_EXT = new Set([".js", ".jsx"]);

function walk(dir) {
    const out = [];
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, ent.name);
        if (ent.isDirectory()) out.push(...walk(p));
        else if (ent.isFile() && ALLOWED_EXT.has(path.extname(p))) out.push(p);
    }
    return out;
}

function main() {
    const files = walk(SRC_DIR);
    let changedCount = 0;

    // Odstraní řádky typu:
    // /** @typedef {import("../../types/dto").MatchDTO} MatchDTO */
    const typedefImportLine =
        /^\s*\/\*\*\s*@typedef\s*\{\s*import\(["'][^"']+["']\)\.[A-Za-z0-9_$]+\s*\}\s*[A-Za-z0-9_$]+\s*\*\/\s*\r?\n?/gm;

    for (const file of files) {
        const orig = fs.readFileSync(file, "utf8");
        const next = orig.replace(typedefImportLine, "");
        if (next !== orig) {
            fs.writeFileSync(file, next, "utf8");
            changedCount++;
            console.log(`UPDATED: ${path.relative(process.cwd(), file)}`);
        }
    }

    console.log(`\nDone. Updated files: ${changedCount}/${files.length}`);
}

main();
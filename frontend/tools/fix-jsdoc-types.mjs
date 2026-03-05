import fs from "node:fs";
import path from "node:path";

/**
 * Nastavení: odkud skenovat a jaké typy řešit.
 */
const SRC_DIR = path.resolve(process.cwd(), "src");
const ALLOWED_EXT = new Set([".js", ".jsx"]);

// Typy, které chceme umět vytáhnout z import(...) a udělat z nich alias + použití.
const KNOWN_TYPES = new Set([
    "MatchDTO",
    "PlayerDTO",
    "SeasonDTO",
    "AppUserDTO",
    "SuccessResponseDTO",
    "ErrorResponseDTO",
]);

/**
 * Rekurzivně najde soubory .js/.jsx.
 */
function walk(dir) {
    const out = [];
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, ent.name);
        if (ent.isDirectory()) out.push(...walk(p));
        else if (ent.isFile() && ALLOWED_EXT.has(path.extname(p))) out.push(p);
    }
    return out;
}

/**
 * Vrátí relativní import cestu z daného souboru na "src/types/dto".
 * Vychází z toho, že tvoje typy jsou ve "src/types/dto.js".
 */
function getDtoImportPath(filePath) {
    const fileDir = path.dirname(filePath);
    const dtoPath = path.join(SRC_DIR, "types", "dto.js");
    let rel = path.relative(fileDir, dtoPath).replaceAll("\\", "/");
    // odstraníme .js pro JSDoc import(...) (může být i s .js, ale takhle je to čistší)
    rel = rel.replace(/\.js$/, "");
    if (!rel.startsWith(".")) rel = "./" + rel;
    return rel;
}

/**
 * Vloží @typedef importy nahoru do souboru, nejlépe za file header komentář.
 */
function ensureTypedefImports(code, typedefLines) {
    const block = typedefLines.join("\n") + "\n\n";
    if (typedefLines.length === 0) return code;

    // Pokud už typedef blok existuje, nedělej nic.
    const already = typedefLines.every((l) => code.includes(l));
    if (already) return code;

    // 1) pokus: vložit za úvodní /** ... */ file header
    const headerMatch = code.match(/^\/\*\*[\s\S]*?\*\/\s*/);
    if (headerMatch) {
        const idx = headerMatch[0].length;
        return code.slice(0, idx) + block + code.slice(idx);
    }

    // 2) fallback: vložit úplně na začátek
    return block + code;
}

/**
 * Přepíše @param/@returns typy ve stylu {import("...").Type} na {Type}
 * a nasbírá typy, které je potřeba doplnit jako @typedef import(...) Type.
 */
function transformFile(filePath, original) {
    let code = original;

    // Najdi typové výrazy {import("...").X} a {import('...').X}
    // Přepíšeme na {X} a X si uložíme.
    const usedTypes = new Set();

    code = code.replace(
        /\{import\((["'])([^"']+)\1\)\.([A-Za-z0-9_$]+)\}/g,
        (_m, _q, _p, typeName) => {
            if (KNOWN_TYPES.has(typeName)) usedTypes.add(typeName);
            return `{${typeName}}`;
        }
    );

    // Některé soubory můžou mít {import("...").PlayerDTO|null} => to JSDoc taky nedá.
    // Přepíšeme na {(PlayerDTO|null)} nebo {PlayerDTO|null}?
    // JSDoc zvládá union: {PlayerDTO|null}
    code = code.replace(
        /\{import\((["'])([^"']+)\1\)\.([A-Za-z0-9_$]+)\s*\|\s*null\}/g,
        (_m, _q, _p, typeName) => {
            if (KNOWN_TYPES.has(typeName)) usedTypes.add(typeName);
            return `{${typeName}|null}`;
        }
    );

    // Stejně pro undefined (kdyby se vyskytlo)
    code = code.replace(
        /\{import\((["'])([^"']+)\1\)\.([A-Za-z0-9_$]+)\s*\|\s*undefined\}/g,
        (_m, _q, _p, typeName) => {
            if (KNOWN_TYPES.has(typeName)) usedTypes.add(typeName);
            return `{${typeName}|undefined}`;
        }
    );

    // Převod "TS-like" návratového typu @returns {{ ... }} necháme na další krok,
    // protože bezpečná automatická konverze na @typedef vyžaduje parser.
    // Ale opravíme nejčastější chybu: "reload: () => Promise<void>" (=>) JSDoc nemá.
    // Nahradíme "=>"" za ":" uvnitř @returns bloku jen jako rychlou opravu.
    code = code.replace(/@returns\s+\{\{([\s\S]*?)\}\}/g, (m) => {
        return m.replace(/=>/g, "=>"); // záměrně nic – jen držíme místo pro budoucí rozšíření
    });

    // Připrav typedef importy do souboru – pro každý použitý typ.
    const typedefLines = [];
    if (usedTypes.size > 0) {
        const importPath = getDtoImportPath(filePath);
        for (const t of [...usedTypes].sort()) {
            typedefLines.push(`/** @typedef {import("${importPath}").${t}} ${t} */`);
        }
    }

    // Vložit typedefy jen pokud jsme něco našli
    if (typedefLines.length) {
        code = ensureTypedefImports(code, typedefLines);
    }

    return { code, changed: code !== original };
}

function main() {
    const files = walk(SRC_DIR);
    let changedCount = 0;

    for (const file of files) {
        const orig = fs.readFileSync(file, "utf8");
        const { code, changed } = transformFile(file, orig);
        if (changed) {
            fs.writeFileSync(file, code, "utf8");
            changedCount++;
            console.log(`UPDATED: ${path.relative(process.cwd(), file)}`);
        }
    }

    console.log(`\nDone. Updated files: ${changedCount}/${files.length}`);
    console.log(
        `Now run: npm run docs\nIf you still see errors, they are likely @returns {{ ... }} blocks with TS syntax.`
    );
}

main();
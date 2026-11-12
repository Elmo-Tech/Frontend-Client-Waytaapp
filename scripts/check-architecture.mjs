import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { importBoundaryError, sourceTarget } from "./architecture-rules.mjs";

const root = fileURLToPath(new URL("../src/", import.meta.url));
const walk = directory => fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry =>
  entry.isDirectory() ? walk(path.join(directory, entry.name)) : [path.join(directory, entry.name)]);
const files = new Map(walk(root).filter(p => /\.[jt]sx?$/.test(p)).map(p => [path.relative(root, p).replaceAll("\\", "/"), fs.readFileSync(p, "utf8")]));
const errors = [];
const graph = new Map();
const clientEntries = [];
const forbiddenServerImports = new Set();
const modules = new Set();
for (const [file, text] of files) {
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, file.endsWith("tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const edges = [];
  const domain = file.match(/^modules\/([^/]+)\//)?.[1];
  if (domain) modules.add(domain);
  const directive = source.statements[0];
  if (/(?:^|\/)server(?:-[^/]+)?\.tsx?$/.test(file)) forbiddenServerImports.add(file);
  if (directive && ts.isExpressionStatement(directive) && ts.isStringLiteral(directive.expression) && directive.expression.text === "use client") clientEntries.push(file);
  if (file.startsWith("app/")) {
    if (!/^(page|layout|loading|error|global-error|not-found|route|apple-icon|icon)\.[jt]sx?$/.test(path.posix.basename(file))) errors.push(`${file}: non-routing source in app`);
    if (file.endsWith("/page.tsx") && text.split("\n").length > 20) errors.push(`${file}: page is no longer thin`);
  }
  const visit = node => {
    let specifier, typeOnly = false;
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
      specifier = node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier) ? node.moduleSpecifier.text : undefined;
      typeOnly = Boolean(node.isTypeOnly || node.importClause?.isTypeOnly);
      const named = node.importClause?.namedBindings;
      if (named && ts.isNamedImports(named) && named.elements.length && named.elements.every(e => e.isTypeOnly)) typeOnly = true;
    } else if (ts.isCallExpression(node) && node.arguments.length === 1 && ts.isStringLiteral(node.arguments[0]) && (node.expression.kind === ts.SyntaxKind.ImportKeyword || node.expression.getText(source) === "require")) specifier = node.arguments[0].text;
    if (specifier) {
      const target = sourceTarget(file, specifier);
      if (target) {
        const error = importBoundaryError(file, target);
        if (error) errors.push(`${file}: ${error} (${specifier})`);
        if (!typeOnly) {
          const resolved = [target, target + ".ts", target + ".tsx", target + "/index.ts", target + "/index.tsx"].find(p => files.has(p));
          if (resolved) edges.push(resolved);
          else if (!/\.(css|svg|png|jpg|webp|woff2)$/.test(target)) errors.push(`${file}: unresolved local import ${specifier}`);
        }
      } else if (!typeOnly && (specifier === "next/headers" || specifier === "server-only" || /^(node:)?(fs|child_process)(\/|$)/.test(specifier))) forbiddenServerImports.add(file);
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  const emitted = ts.transpileModule(text, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2023, jsx: ts.JsxEmit.Preserve } }).outputText;
  const runtime = ts.createSourceFile(file, emitted, ts.ScriptTarget.Latest, true, file.endsWith("tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const runtimeEdges = [];
  function runtimeVisit(node) {
    let spec;
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) spec = node.moduleSpecifier?.text;
    else if (ts.isCallExpression(node) && node.arguments.length === 1 && ts.isStringLiteral(node.arguments[0]) && node.expression.kind === ts.SyntaxKind.ImportKeyword) spec = node.arguments[0].text;
    if (spec) {
      const target = sourceTarget(file, spec);
      const resolved = target && [target, target + ".ts", target + ".tsx", target + "/index.ts", target + "/index.tsx"].find(p => files.has(p));
      if (resolved) runtimeEdges.push(resolved);
    }
    ts.forEachChild(node, runtimeVisit);
  }
  runtimeVisit(runtime);
  graph.set(file, runtimeEdges);
}
const visited = new Set(), active = new Set();
function cycle(file, trail) {
  if (active.has(file)) { errors.push(`Runtime dependency cycle: ${[...trail, file].join(" -> ")}`); return; }
  if (visited.has(file)) return;
  active.add(file);
  for (const next of graph.get(file) || []) cycle(next, [...trail, file]);
  active.delete(file);
  visited.add(file);
}
for (const file of files.keys()) cycle(file, []);
for (const entry of clientEntries) {
  const seen = new Set();
  function check(file, trail) {
    if (seen.has(file)) return;
    seen.add(file);
    if (forbiddenServerImports.has(file)) errors.push(`Client reaches server-only code: ${[...trail, file].join(" -> ")}`);
    for (const next of graph.get(file) || []) check(next, [...trail, file]);
  }
  check(entry, []);
}
if (errors.length) { console.error(errors.join("\n")); process.exitCode = 1; }
else console.log(`Architecture PASS: ${files.size} source files, ${modules.size} domains, no runtime cycles, no reversed boundaries, no client-to-server imports.`);

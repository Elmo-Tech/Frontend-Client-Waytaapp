import path from "node:path";

export function importBoundaryError(importer, target) {
  const shared = /^(components|lib|hooks|config|types|styles)\//.test(importer);
  if (shared && target.startsWith("modules/")) return "Shared code must not depend on business modules.";
  if (!importer.startsWith("app/") && target.startsWith("app/")) return "Only routes may depend on App Router files.";
  const sourceModule = importer.match(/^modules\/([^/]+)\//)?.[1];
  const targetModule = target.match(/^modules\/([^/]+)(?:\/|$)/)?.[1];
  if (!targetModule) return null;
  const entry = target.replace(/\.(tsx?|jsx?)$/, "").replace(/\/index$/, "");
  const isEntry = entry === `modules/${targetModule}` || new RegExp(`^modules/${targetModule}/[^/]+$`).test(entry);
  if (sourceModule === targetModule && entry === `modules/${targetModule}`) return "Module internals must not import their own barrel.";
  if (sourceModule !== targetModule && !isEntry) return "Import another module through its public index or explicit server entry.";
  return null;
}

export function sourceTarget(importer, specifier) {
  if (specifier.startsWith("@/")) return specifier.slice(2);
  if (specifier.startsWith(".")) return path.posix.normalize(path.posix.join(path.posix.dirname(importer), specifier));
  return null;
}

export const architecturePlugin = {
  rules: {
    boundaries: {
      meta: { type: "problem", schema: [], messages: { boundary: "{{message}}" } },
      create(context) {
        const normalized = context.filename.replaceAll("\\", "/");
        const src = normalized.lastIndexOf("/src/");
        if (src === -1) return {};
        const importer = normalized.slice(src + 5);
        function check(node) {
          if (typeof node.source?.value !== "string") return;
          const target = sourceTarget(importer, node.source.value);
          const message = target && importBoundaryError(importer, target);
          if (message) context.report({ node, messageId: "boundary", data: { message } });
        }
        return { ImportDeclaration: check, ExportNamedDeclaration: check, ExportAllDeclaration: check };
      },
    },
  },
};

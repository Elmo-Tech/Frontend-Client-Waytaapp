import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const project = fileURLToPath(new URL('../../', import.meta.url));
const paths = JSON.parse(fs.readFileSync(new URL('./source-paths.json', import.meta.url), 'utf8'));
export const legacySourceUrl = source => pathToFileURL(path.join(project, source)).href;
export function sourcePath(value) {
  const raw = value instanceof URL ? fileURLToPath(value) : String(value);
  const absolute = path.isAbsolute(raw) ? raw : path.resolve(raw);
  const relative = path.relative(project, absolute).replaceAll('\\', '/');
  if (paths[relative]) return path.join(project, Array.isArray(paths[relative]) ? paths[relative][0] : paths[relative]);
  // The checkout's product rendering directory is walked by the original checkout-field assertion.
  if (relative === 'src/app/q/[publicCode]/' || relative === 'src/app/q/[publicCode]') return path.join(project,'src/modules/guest-menu/components');
  if (relative.startsWith('src/app/q/[publicCode]/')) return path.join(project, 'src/modules/guest-menu/components', relative.slice('src/app/q/[publicCode]/'.length));
  return absolute;
}
export const readFileSync = (value, ...options) => {
  const raw = value instanceof URL ? fileURLToPath(value) : path.resolve(String(value));
  const relative = path.relative(project, raw).replaceAll('\\', '/');
  if (Array.isArray(paths[relative])) {
    const text = paths[relative].map(file => fs.readFileSync(path.join(project, file), 'utf8')).join('\n');
    return options[0] ? text : Buffer.from(text);
  }
  return fs.readFileSync(sourcePath(value), ...options);
};
export const readdirSync = (value, ...options) => fs.readdirSync(sourcePath(value), ...options);
export const statSync = (value, ...options) => fs.statSync(sourcePath(value), ...options);

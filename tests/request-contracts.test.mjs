import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import ts from 'typescript';

const root = new URL('../', import.meta.url);
const cases = JSON.parse(readFileSync(new URL('./contracts/request-implementations.json', import.meta.url), 'utf8'));
const printer = ts.createPrinter({ removeComments: true, newLine: ts.NewLineKind.LineFeed });
const cache = new Map();
function implementations(file) {
  if (cache.has(file)) return cache.get(file);
  const source = ts.createSourceFile(file, readFileSync(new URL(file, root), 'utf8'), ts.ScriptTarget.Latest, true);
  const result = new Map();
  for (const node of source.statements) {
    if (ts.isFunctionDeclaration(node) && node.name && node.body) {
      result.set(node.name.text, node.parameters.map(p => printer.printNode(ts.EmitHint.Unspecified, p, source)).join(',') + '\n' + printer.printNode(ts.EmitHint.Unspecified, node.body, source));
    } else if (ts.isVariableStatement(node)) {
      for (const declaration of node.declarationList.declarations) {
        if (declaration.initializer && (ts.isArrowFunction(declaration.initializer) || ts.isFunctionExpression(declaration.initializer))) {
          result.set(declaration.name.getText(source), printer.printNode(ts.EmitHint.Unspecified, declaration.initializer, source));
        }
      }
    }
  }
  cache.set(file, result);
  return result;
}
for (const example of cases) {
  test(`${example.baseline}: ${example.name} retains its original request/response implementation`, () => {
    const actual = implementations(example.file).get(example.name);
    assert.ok(actual, 'The original request function must remain present');
    assert.equal(createHash('sha256').update(actual).digest('hex'), example.sha256);
  });
}

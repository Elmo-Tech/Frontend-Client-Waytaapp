import assert from 'node:assert/strict';
import test from 'node:test';
import { registerHooks } from 'node:module';
// Node's strip-types runner needs explicit extension resolution for app-local imports.
registerHooks({
  resolve(specifier, context, nextResolve) {
    try {
      return nextResolve(specifier, context);
    } catch (error) {
      if (specifier.startsWith('.') && !/\.[a-z]+$/i.test(specifier))
        return nextResolve(specifier + '.ts', context);
      throw error;
    }
  },
});
const { buildCartLines, toSubmitItems, toPendingItems } =
  await import('../../src/modules/guest-menu/utils/cart-lines.ts');
const {
  emptyDraft,
  typedItem,
  menuItem,
  addIncluded,
  addChoice,
  normalizeMoneyInput,
  validate,
  toInput,
} =
  await import('../../src/modules/offers/components/menu/offers/offer-draft.ts');

const product = {
  id: 'product-1',
  name: 'Dish',
  basePrice: '100.00',
  discount: { discountedPrice: '90.00' },
  availability: 'AVAILABLE',
  primaryImageAssetPath: null,
  modifierGroups: [
    {
      id: 'extras',
      name: 'Extras',
      options: [{ id: 'cheese', name: 'Cheese', priceAdjustment: '5.50' }],
    },
  ],
  variants: [],
};
const stored = {
  productId: product.id,
  quantity: 3,
  modifierOptionIds: ['cheese'],
  variantId: null,
};
const categories = new Map([
  [product.id, { id: 'category-1', name: 'Food', order: 0 }],
]);
const lines = (p = product, cart = [stored]) =>
  buildCartLines(cart, [], new Map([[p.id, p]]), categories, 'en');

test('cart display uses exact discount and extras arithmetic without changing request authority', () => {
  const [line] = lines();
  assert.equal(line.unitPrice, '95.50');
  assert.equal(line.lineTotal, '286.50');
  assert.equal(line.originalLineTotal, '316.50');
  assert.deepEqual(toSubmitItems([line]), [
    { productId: product.id, quantity: 3, modifierOptionIds: ['cheese'] },
  ]);
  assert.equal('unitPrice' in toPendingItems([line])[0], false);
  assert.equal(line.category.name, 'Food');
});
test('removed products disappear; sold-out products and missing sizes block checkout', () => {
  assert.deepEqual(
    buildCartLines([stored], [], new Map(), categories, 'en'),
    [],
  );
  assert.equal(
    lines({ ...product, availability: 'SOLD_OUT' })[0].blocked,
    true,
  );
  assert.equal(
    lines({
      ...product,
      variants: [
        { id: 'large', name: 'Large', price: '120.00', discountedPrice: null },
      ],
    })[0].blocked,
    true,
  );
});
test('current menu prices replace old display amounts without changing stored identities', () => {
  const original = structuredClone(stored);
  const updated = lines({ ...product, basePrice: '110.00', discount: null });
  assert.equal(updated[0].lineTotal, '346.50');
  assert.deepEqual(stored, original);
});
test('offer input normalizes Arabic money, retains exact decimals and serializes translations', () => {
  const draft = emptyDraft();
  draft.names = { en: 'Lunch', ar: 'غداء' };
  draft.price = '١٢٣٫٥٠';
  const item = typedItem();
  item.names = { en: 'Soup', ar: 'شوربة' };
  item.quantity = 2;
  draft.included = [item];
  assert.equal(normalizeMoneyInput(draft.price), '123.50');
  assert.equal(
    validate(draft, 'en', (key) => key),
    null,
  );
  const payload = toInput(draft, ['en', 'ar']);
  assert.equal(payload.price, '123.50');
  assert.equal(payload.slots[0].kind, 'FIXED');
  assert.equal(payload.slots[0].options[0].quantity, 2);
  assert.deepEqual(payload.names, draft.names);
});
test('included linked items merge quantities while choice groups avoid duplicate products', () => {
  const choice = {
    id: product.id,
    names: { en: 'Dish' },
    variants: [],
    orderable: true,
  };
  const item = menuItem(choice, null);
  assert.equal(addIncluded([item], item)[0].quantity, 2);
  assert.equal(addChoice([item], item).length, 1);
  const draft = emptyDraft();
  assert.equal(
    validate(draft, 'en', (key) => key),
    'offers.error.name',
  );
});

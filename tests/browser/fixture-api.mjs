import { createServer } from 'node:http';
const uuid = (n) =>
  `${n}`.repeat(8) +
  '-' +
  `${n}`.repeat(4) +
  '-4' +
  `${n}`.repeat(3) +
  '-8' +
  `${n}`.repeat(3) +
  '-' +
  `${n}`.repeat(12);
const product = uuid(2),
  branch = uuid(4),
  templates = [
    'CLASSIC',
    'LIST',
    'GALLERY',
    'MENU',
    'FLOATING',
    'CENTERED',
    'COMPACT',
    'EDITORIAL',
    'EMBER',
    'BLOOM',
    'BREW',
  ];
export const requests = [];
export const state = { orderMode: 'success', attempts: 0, price: '100.00' };
const contact = Object.fromEntries(
  [
    'phone',
    'whatsapp',
    'hotline',
    'facebookUrl',
    'instagramUrl',
    'tiktokUrl',
    'telegramUrl',
    'youtubeUrl',
    'xUrl',
    'snapchatUrl',
    'mapsUrl',
    'websiteUrl',
  ].map((k) => [k, null]),
);
export const api = createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost:14480');
  let body = '';
  for await (const c of req) body += c;
  res.setHeader(
    'Access-Control-Allow-Origin',
    req.headers.origin || 'http://localhost:14482',
  );
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Idempotency-Key');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Content-Type', 'application/json');
  const send = (data, status = 200) => {
    res.statusCode = status;
    res.end(JSON.stringify(data));
  };
  if (req.method === 'OPTIONS') return send({});
  if (url.pathname.endsWith('/auth/me'))
    return send(
      { error: { code: 'UNAUTHENTICATED' } },
      req.headers.cookie?.includes('qa_outage=1') ? 503 : 401,
    );
  if (url.pathname.endsWith('/landing/plans'))
    return send({ data: { trialDays: 15, plans: [] } });
  if (url.pathname.match(/\/public\/qr\/[^/]+\/menu$/)) {
    const code = url.pathname.split('/').at(-2),
      lang = url.searchParams.get('lang') === 'ar' ? 'ar' : 'en';
    if (code === 'missing')
      return send({ error: { code: 'QR_NOT_FOUND' } }, 404);
    if (code === 'unavailable')
      return send({ error: { code: 'MENU_NOT_AVAILABLE' } }, 409);
    const exclusive = {
      verde: 'VERDE_NAPOLI_V1',
      sherbiny: 'SHERBINY_FIRE_DOUGH_V1',
      makkboz: 'MAKKBOZ_HERITAGE_V1',
      meat: 'MEAT_LOVERS_BUTCHER_V1',
    }[code];
    return send({
      data: {
        context: {
          entry: { publicCode: code, redirectToSlug: null },
          platform: { poweredByUrl: 'https://waytaapp.com' },
          qrType: code === 'table' ? 'TABLE' : 'GENERIC',
          tableOrdering: code === 'table' ? 'AVAILABLE' : null,
          restaurant: {
            name: lang === 'ar' ? 'مطعم التجربة' : 'Pilot Restaurant',
            currencyCode: 'EGP',
            countryCode: 'EG',
            logoAssetPath: null,
            coverAssetPath: null,
            menuTemplate: 'CLASSIC',
            exclusiveRendererKey: exclusive,
            exclusiveInUse: !!exclusive,
            contact,
            shareCode: null,
            hours: null,
          },
          branch: code === 'table' ? { name: 'Main branch' } : null,
          table: code === 'table' ? { number: '7' } : null,
          announcements: [],
          offers: [],
          suggestions: false,
          tracking: false,
          templatesAllowed: true,
          allowedTemplates: templates,
          ordering: { pickup: true, delivery: false, whatsapp: false },
          pickupBranches: [{ id: branch, name: 'Main branch', hours: null }],
          deliveryBranches: [],
          locations: [],
        },
        locale: {
          requested: lang,
          resolved: lang,
          default: 'en',
          available: ['en', 'ar'],
        },
        menu: {
          id: uuid(5),
          name: 'Main menu',
          description: 'Fresh dishes every day',
          categories: [
            {
              id: uuid(3),
              name: lang === 'ar' ? 'بيتزا' : 'Pizza',
              description: null,
              imageAssetPath: null,
              products: [
                {
                  id: product,
                  name: lang === 'ar' ? 'بيتزا مارجريتا' : 'Pizza Margherita',
                  description: 'Tomato, mozzarella and basil',
                  basePrice: state.price,
                  discount: null,
                  primaryImageAssetPath: null,
                  availability: 'AVAILABLE',
                  featured: true,
                  modifierGroups: [],
                  variants: [],
                },
              ],
            },
          ],
        },
      },
    });
  }
  if (req.method === 'POST' && url.pathname.endsWith('/orders')) {
    requests.push({ path: url.pathname, body: JSON.parse(body) });
    state.attempts++;
    await new Promise((r) => setTimeout(r, 200));
    if (state.orderMode === 'network')
      return send({ error: { code: 'INTERNAL_ERROR' } }, 503);
    if (state.orderMode === 'price') {
      state.price = '110.00';
      return send(
        { error: { code: 'PRICE_CHANGED', details: { total: '110.00' } } },
        422,
      );
    }

    return send({
      data: {
        id: uuid(7),
        status: 'PENDING',
        currencyCode: 'EGP',
        total: '100.00',
        createdAt: '2026-11-12T10:00:00.000Z',
        type: 'DINE_IN',
        table: { number: '7' },
        pickupBranch: null,
        delivery: null,
        subtotal: '100.00',
        deliveryFee: '0.00',
        discountTotal: '0.00',
        items: [
          {
            productId: product,
            name: 'Pizza Margherita',
            variantName: null,
            quantity: 1,
            unitPrice: '100.00',
            discountAmount: '0.00',
            lineTotal: '100.00',
            modifiers: [],
          },
        ],
      },
    });
  }
  return send({ error: { code: 'NOT_FOUND' } }, 404);
});

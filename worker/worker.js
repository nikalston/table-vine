export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders() });
    }

    const url = new URL(request.url);
    const barcode = url.searchParams.get('barcode');
    if (!barcode || !/^\d{8,14}$/.test(barcode)) {
      return json({ error: 'Invalid barcode' }, 400);
    }

    const result = await lookupBarcode(barcode, env);
    return json(result);
  }
};

async function lookupBarcode(barcode, env) {
  const upcDbKey = env.UPCDB_API_KEY || '';

  // 1. Try UPC Database (best coverage for US alcohol products)
  if (upcDbKey) {
    try {
      const res = await fetch(
        `https://api.upcdatabase.org/product/${barcode}?apikey=${upcDbKey}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.title) {
          return {
            found: true,
            name: data.title,
            brand: data.brand || '',
            category: detectCategory(data.title + ' ' + (data.category || '') + ' ' + (data.description || '')),
            source: 'upcdatabase.org'
          };
        }
      }
    } catch {}
  }

  // 2. Try Open Food Facts
  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`,
      { headers: { 'User-Agent': 'TableVineInventory/1.0' } }
    );
    if (res.ok) {
      const data = await res.json();
      if (data.status === 1 && data.product) {
        const p = data.product;
        const name = p.product_name || p.product_name_en || '';
        if (name) {
          const brand = p.brands || '';
          const qty = p.quantity || '';
          const fullName = [brand, name, qty].filter(Boolean).join(' ');
          const catText = [name, p.categories || '', (p.categories_tags || []).join(' ')].join(' ');
          return {
            found: true,
            name: fullName,
            brand: brand,
            category: detectCategory(catText),
            source: 'openfoodfacts.org'
          };
        }
      }
    }
  } catch {}

  return { found: false };
}

function detectCategory(text) {
  const t = text.toLowerCase();
  if (/\b(wine|ros[eé]|champagne|prosecco|pinot|chardonnay|cabernet|merlot|sauvignon|riesling|moscato|malbec|zinfandel|shiraz|syrah|bordeaux|burgundy|chianti|sangria|chablis|beaujolais|grenache|tempranillo|viognier|gewurztraminer)\b/.test(t)) return 'Wine';
  if (/\b(whiskey|whisky|vodka|rum|gin|tequila|mezcal|bourbon|scotch|brandy|cognac|liqueur|schnapps|absinthe|amaretto|kahlua|baileys|spirit|spirits|vermouth|triple sec|cointreau|campari|aperol|grappa|sake|soju)\b/.test(t)) return 'Spirits';
  if (/\b(beer|ale|lager|stout|porter|ipa|pilsner|hefeweizen|wheat beer|craft beer|cider|seltzer|malt|kolsch|saison|gose|bock|dunkel|marzen|radler|shandy)\b/.test(t)) return 'Beer';
  return 'Wine';
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() }
  });
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
}

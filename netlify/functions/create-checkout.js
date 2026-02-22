const Stripe = require('stripe');

// Server-side price catalog — browser-supplied prices are never trusted
const PRICE_CATALOG = {
  'Amber Horizons (Print)':    8500,
  'Amber Horizons (Original)': 240000,
  'Neural Garden (Print)':     7500,
  'Still Water (Print)':       8500,
  'Still Water (Original)':    180000,
  'Morning Fog (Print)':       8500,
  'Ochre Fields (Original)':   150000,
  'Ochre Fields (Print)':      7500,
  'Landscape #2 (Original)':   25000,
  'Landscape #4 (Original)':   15000,
  'Landscape (Original)':      15000,
  'Landscape #5 (Original)':   17500,
  'Garden (Original)':             50000,
  'Untitled Painting II (Original)': 37500,
  'Space for Things (Original)': 15000,
  'Untitled Painting (Original)': 75000,
  'Untitled Drawing (Original)': 25000,
  'Space (Original)':           15000,
  'Transit (Original)':         40000,
  'Field and House (Original)': 40000,
  'Landscape #11 (Original)':  30000,
  'Landscape #13 (Original)':  27500,
  'Landscape #7 (Original)':   25000,
  'Landscape #9 (Original)':   35000,
  'Patron (Original)':         35000,
  'Waiting (Original)':        45000,
  'Well (Original)':           50000,
  'Untitled (Original)':       35000,
};

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let items;
  try {
    ({ items } = JSON.parse(event.body));
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid request body' }) };
  }

  if (!Array.isArray(items) || items.length === 0) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Cart is empty' }) };
  }

  // Validate every item against the server-side catalog
  const lineItems = [];
  for (const item of items) {
    const unitAmount = PRICE_CATALOG[item.name];
    if (!unitAmount) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: `Unknown item: ${item.name}` }),
      };
    }
    lineItems.push({
      price_data: {
        currency: 'usd',
        product_data: { name: item.name },
        unit_amount: unitAmount,
      },
      quantity: 1,
    });
  }

  const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
  const siteUrl = process.env.URL || 'http://localhost:8888';

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      shipping_address_collection: { allowed_countries: ['US', 'CA', 'GB', 'AU'] },
      success_url: `${siteUrl}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/#shop`,
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: session.url }),
    };
  } catch (err) {
    console.error('Stripe error:', err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Could not create checkout session' }),
    };
  }
};

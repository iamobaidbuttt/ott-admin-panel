import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

const COOKIES_KEY = 'ott_cookies_data';

// Default data structure
const defaultData = {
  version: "3.0",
  lastUpdated: new Date().toISOString().split('T')[0],
  services: {
    chatgpt: {
      url: "https://chatgpt.com",
      redirectUrl: "https://chatgpt.com/",
      clearDomain: "chatgpt.com",
      cookies: []
    },
    canva: {
      url: "https://www.canva.com",
      redirectUrl: "https://www.canva.com/",
      clearDomain: "canva.com",
      cookies: []
    },
    perplexity: {
      url: "https://www.perplexity.ai",
      redirectUrl: "https://www.perplexity.ai/",
      clearDomain: "perplexity.ai",
      cookies: []
    },
    netflix: {
      url: "https://www.netflix.com",
      redirectUrl: "https://www.netflix.com/browse",
      clearDomain: "netflix.com",
      cookies: []
    },
    hotstar: {
      url: "https://www.hotstar.com",
      redirectUrl: "https://www.hotstar.com/in/home",
      clearDomain: "hotstar.com",
      cookies: []
    }
  }
};

// GET - Return cookies (for extension to fetch)
export async function GET(request) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
  };

  try {
    let data = await kv.get(COOKIES_KEY);
    
    if (!data) {
      // Initialize with default data
      await kv.set(COOKIES_KEY, defaultData);
      data = defaultData;
    }

    return NextResponse.json(data, { headers });
  } catch (error) {
    console.error('KV Error:', error);
    return NextResponse.json(defaultData, { headers });
  }
}

// POST - Update cookies (from admin panel)
export async function POST(request) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  try {
    // Check authorization
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401, headers });
    }

    const { service, cookies } = await request.json();

    if (!service || !cookies) {
      return NextResponse.json({ success: false, error: 'Missing service or cookies' }, { status: 400, headers });
    }

    // Get current data
    let data = await kv.get(COOKIES_KEY);
    if (!data) {
      data = { ...defaultData };
    }

    if (!data.services[service]) {
      return NextResponse.json({ success: false, error: 'Invalid service' }, { status: 400, headers });
    }

    // Update cookies for the service
    data.services[service].cookies = cookies;
    data.lastUpdated = new Date().toISOString().split('T')[0];
    data.version = (parseFloat(data.version) + 0.1).toFixed(1);

    // Save to KV
    await kv.set(COOKIES_KEY, data);

    return NextResponse.json({ 
      success: true, 
      message: `${service} cookies updated`,
      cookieCount: cookies.length 
    }, { headers });

  } catch (error) {
    console.error('Save Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500, headers });
  }
}

// OPTIONS - Handle CORS preflight
export async function OPTIONS(request) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

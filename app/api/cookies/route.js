import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const COOKIES_KEY = 'ott_cookies_data';

const defaultData = {
  version: "3.0",
  lastUpdated: new Date().toISOString().split('T')[0],
  services: {
    chatgpt: { url: "https://chatgpt.com", redirectUrl: "https://chatgpt.com/", clearDomain: "chatgpt.com", cookies: [] },
    canva: { url: "https://www.canva.com", redirectUrl: "https://www.canva.com/", clearDomain: "canva.com", cookies: [] },
    perplexity: { url: "https://www.perplexity.ai", redirectUrl: "https://www.perplexity.ai/", clearDomain: "perplexity.ai", cookies: [] },
    netflix: { url: "https://www.netflix.com", redirectUrl: "https://www.netflix.com/browse", clearDomain: "netflix.com", cookies: [] },
    hotstar: { url: "https://www.hotstar.com", redirectUrl: "https://www.hotstar.com/in/home", clearDomain: "hotstar.com", cookies: [] }
  }
};

export async function GET(request) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
  };
  try {
    let data = await redis.get(COOKIES_KEY);
    if (!data) {
      await redis.set(COOKIES_KEY, defaultData);
      data = defaultData;
    }
    return NextResponse.json(data, { headers });
  } catch (error) {
    console.error('Redis Error:', error);
    return NextResponse.json(defaultData, { headers });
  }
}

export async function POST(request) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401, headers });
    }
    const { service, cookies } = await request.json();
    if (!service || !cookies) {
      return NextResponse.json({ success: false, error: 'Missing service or cookies' }, { status: 400, headers });
    }
    let data = await redis.get(COOKIES_KEY);
    if (!data) data = { ...defaultData };
    if (!data.services[service]) {
      return NextResponse.json({ success: false, error: 'Invalid service' }, { status: 400, headers });
    }
    data.services[service].cookies = cookies;
    data.lastUpdated = new Date().toISOString().split('T')[0];
    data.version = (parseFloat(data.version) + 0.1).toFixed(1);
    await redis.set(COOKIES_KEY, data);
    return NextResponse.json({ success: true, message: `${service} cookies updated`, cookieCount: cookies.length }, { headers });
  } catch (error) {
    console.error('Save Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500, headers });
  }
}

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

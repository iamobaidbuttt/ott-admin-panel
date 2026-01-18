import { NextResponse } from 'next/server';

const COOKIES_KEY = 'ott_cookies_data';
let memoryStorage = null;

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

async function getRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  try {
    const { Redis } = await import('@upstash/redis');
    return new Redis({ url, token });
  } catch (e) { return null; }
}

async function getData() {
  const redis = await getRedis();
  if (redis) {
    try {
      const data = await redis.get(COOKIES_KEY);
      if (data) return data;
    } catch (e) { console.error(e); }
  }
  if (memoryStorage) return memoryStorage;
  return { ...defaultData };
}

async function saveData(data) {
  const redis = await getRedis();
  if (redis) {
    try { await redis.set(COOKIES_KEY, data); return true; } catch (e) { console.error(e); }
  }
  memoryStorage = data;
  return true;
}

export async function GET(request) {
  const headers = { 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-cache' };
  try {
    const data = await getData();
    return NextResponse.json(data, { headers });
  } catch (error) {
    return NextResponse.json(defaultData, { headers });
  }
}

export async function POST(request) {
  const headers = { 'Access-Control-Allow-Origin': '*' };
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401, headers });
    }
    const { service, cookies } = await request.json();
    if (!service || !cookies) {
      return NextResponse.json({ success: false, error: 'Missing data' }, { status: 400, headers });
    }
    let data = await getData();
    if (!data.services) data = { ...defaultData };
    if (!data.services[service]) {
      return NextResponse.json({ success: false, error: 'Invalid service' }, { status: 400, headers });
    }
    data.services[service].cookies = cookies;
    data.lastUpdated = new Date().toISOString().split('T')[0];
    data.version = (parseFloat(data.version || "3.0") + 0.1).toFixed(1);
    await saveData(data);
    return NextResponse.json({ success: true, message: `${service} updated`, cookieCount: cookies.length }, { headers });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500, headers });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' } });
}

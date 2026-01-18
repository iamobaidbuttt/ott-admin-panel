import { NextResponse } from 'next/server';

// Set your admin password here or use environment variable
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'samkhan123';

export async function POST(request) {
  try {
    const { password } = await request.json();
    
    if (password === ADMIN_PASSWORD) {
      // Generate simple token
      const token = Buffer.from(`admin:${Date.now()}`).toString('base64');
      return NextResponse.json({ success: true, token });
    }
    
    return NextResponse.json({ success: false, error: 'Invalid password' }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Auth failed' }, { status: 500 });
  }
}


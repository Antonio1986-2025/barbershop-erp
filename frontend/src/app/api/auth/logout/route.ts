import { NextRequest } from 'next/server';

const API = 'http://localhost:3001';

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const res = await fetch(`${API}/api/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });
    return new Response(await res.text(), {
      status: res.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return Response.json({}, { status: 200 });
  }
}
import { NextRequest } from 'next/server';

const API = 'http://localhost:3001';

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization');
    const res = await fetch(`${API}/api/auth/me`, {
      headers: { ...(token ? { Authorization: token } : {}) },
    });
    return new Response(await res.text(), {
      status: res.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return Response.json({ message: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const res = await fetch(`${API}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });
    return new Response(await res.text(), {
      status: res.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return Response.json({ message: e.message }, { status: 500 });
  }
}
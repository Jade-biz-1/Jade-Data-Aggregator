import { NextRequest, NextResponse } from 'next/server';

const BACKEND = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api/v1';

/**
 * Server-side proxy for /api/search → backend /search
 * Avoids cross-origin fetch issues in the browser entirely.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const q = searchParams.get('q');

  if (!q) {
    return NextResponse.json({ results: {}, total_results: 0 });
  }

  // Forward the Authorization cookie as a Bearer header so the backend
  // can authenticate the request.
  const token = request.cookies.get('access_token')?.value;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const limit = searchParams.get('limit') ?? '10';
  const backendUrl = `${BACKEND}/search?q=${encodeURIComponent(q)}&limit=${limit}`;

  try {
    const res = await fetch(backendUrl, { headers, cache: 'no-store' });
    if (!res.ok) {
      return NextResponse.json({ results: {}, total_results: 0 }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ results: {}, total_results: 0 }, { status: 503 });
  }
}

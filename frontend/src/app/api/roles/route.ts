import { NextRequest, NextResponse } from 'next/server';

const BACKEND = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api/v1';

/**
 * Server-side proxy for /api/roles → backend /roles
 * Avoids cross-origin fetch issues in the browser.
 */
export async function GET(request: NextRequest) {
  const token = request.cookies.get('access_token')?.value;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${BACKEND}/roles`, { headers, cache: 'no-store' });
    if (!res.ok) {
      return NextResponse.json({ roles: [] }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ roles: [] }, { status: 503 });
  }
}

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Only apply to v1 API routes
  if (request.nextUrl.pathname.startsWith('/api/v1')) {
    const apiKey = request.headers.get('x-api-key');

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is missing. Provide it in x-api-key header.' },
        { status: 401 }
      );
    }

    // We can't easily call Firestore from Edge Middleware without a dedicated REST API 
    // or using the Firebase Admin SDK (which doesn't work in Edge).
    // So for now, we'll let the individual route handlers handle the validation
    // because they run in the Node.js runtime where Firestore works.
    
    // In a production app, we would use a more robust solution like a 
    // separate authentication service or a cache for API keys.
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/v1/:path*',
};

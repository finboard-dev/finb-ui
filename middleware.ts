import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  console.log("Middleware triggered for API request");
  
  const requestHeaders = new Headers(request.headers);

  requestHeaders.set(
    'Authorization',
    'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2VtYWlsIjoidWpqd2FsQGZpbmJvYXJkLmFpIiwiaWF0IjoxNzQ0NzIzMjI0LCJleHAiOjE3Njk5MjMyMjQsImNyZWF0ZWRfYXQiOiIyMDI1LTA0LTE1VDEzOjIwOjI0LjcxMzczMyswMDowMCJ9.p5qU5JPKvBC1Mc2OAnyH0zZaP60NyvuZZWFGN9SQaio'
  );

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ['/api/:path*' , '/api/users/me'], 
};
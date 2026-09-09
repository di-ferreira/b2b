import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = cookies();
  cookieStore.delete('token_b2b');
  cookieStore.delete('user_b2b');
  cookieStore.delete('CIC');

  return NextResponse.redirect(new URL('/auth', 'http://localhost:3000'));
}

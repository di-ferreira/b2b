'use client';
import { removeCookie } from '@/app/actions';

export default async function Logout() {
  await removeCookie('token');
  await removeCookie('user');

  //   redirect('/auth');
}


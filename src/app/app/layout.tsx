import { getCookie } from '@/app/actions';
import Header from '@/components/Header';
import NavBar from '@/components/NavBar';
import SessionWrapper from '@/components/SessionWrapper';

export default async function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const codeUser = await getCookie('user_b2b');

  return (
    <SessionWrapper>
      <Header />
      <section className='flex flex-row w-screen h-full overflow-hidden bg-gray-200'>
        <NavBar codeUser={codeUser} />
        {children}
      </section>
    </SessionWrapper>
  );
}

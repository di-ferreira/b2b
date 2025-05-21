import Header from '@/components/Header';
import NavBar from '@/components/NavBar';
import SessionWrapper from '@/components/SessionWrapper';

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SessionWrapper>
      <Header />
      <section className='flex flex-row w-screen h-full overflow-hidden bg-gray-200'>
        <NavBar />
        {children}
      </section>
    </SessionWrapper>
  );
}


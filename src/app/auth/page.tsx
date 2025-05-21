import { getCookie } from 'cookies-next';
import { cookies } from 'next/headers';
import Image from 'next/image';
import { redirect } from 'next/navigation';
import Logo from '../../../public/LogoAutosul.png';
import { AuthForm } from './_components/authForm';

export default function Page() {
  const tokenCookie = getCookie('token', { cookies });
  if (tokenCookie !== undefined) {
    redirect('/app/dashboard');
  }
  return (
    <main className='flex flex-col  min-h-screen items-center justify-center bg-emsoft_light-surface'>
      <section className='p-4 w-[400px] h-[500px] shadow-lg rounded-md bg-white tablet-portrait:w-[90vw] tablet-portrait:h-[60vh]'>
        <div className='flex flex-col items-center justify-center mt-5'>
          <Image
            src={Logo}
            alt='Logo da Emsoft'
            className='h-[15vh] w-auto tablet-portrait:h-[10vh]'
          />
          <AuthForm />
        </div>
      </section>
    </main>
  );
}


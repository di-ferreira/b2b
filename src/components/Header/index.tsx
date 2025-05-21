import Image from 'next/image';
import { Suspense } from 'react';
import LogoBranca from '../../../public/LogoAutosulBraca.png';
import ButtonSingOut from '../ui/ButtonLogout';
import UserNameText from './UserNameText';

const Header = () => {
  return (
    <header className='flex w-full px-6 py-3 items-center justify-between shadow-lg bg-emsoft_blue-main'>
      <Image src={LogoBranca} className='h-[5vh] w-auto' alt='Logo AutoSul' />
      <section className='flex px-1'>
        <Suspense fallback={<span>Carregando nome do vendedor...</span>}>
          <UserNameText />
        </Suspense>
        <ButtonSingOut />
      </section>
    </header>
  );
};

export default Header;


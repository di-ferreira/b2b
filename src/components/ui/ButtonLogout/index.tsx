'use client';
import { removeCookie } from '@/app/actions';
import { faPowerOff } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useRouter } from 'next/navigation';
import { Button } from '../button';

const ButtonSingOut = () => {
  const route = useRouter();
  async function logOut() {
    await removeCookie('token');
    await removeCookie('user');
    route.replace('/auth');
  }

  return (
    <Button variant={'ghostSecondary'} title='Sair' onClick={logOut}>
      <FontAwesomeIcon icon={faPowerOff} className='h-full' />
    </Button>
  );
};

export default ButtonSingOut;


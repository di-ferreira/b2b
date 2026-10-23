import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Link from 'next/link';

export interface iNavItem {
  icon: IconProp;
  text: string;
  link?: string;
  onClick?: () => void;
}

const NavBarItem = ({ icon, link, text, onClick }: iNavItem) => {
  const content = (
    <>
      <span
        className={
          'flex items-center justify-center w-5 h-auto pr-1 ml-1 mr-[18px] md:ml-2'
        }
      >
        <FontAwesomeIcon
          icon={icon}
          className='text-emsoft_light-main'
          size='xl'
        />
      </span>
      {text}
    </>
  );

  return (
    <li
      className='gap-3 my-1 transition-all hover:bg-emsoft_blue-light'
      title={text}
    >
      {onClick ? (
        <button
          type='button'
          onClick={onClick}
          className='flex items-center w-full text-emsoft_light-main p-3'
        >
          {content}
        </button>
      ) : (
        <Link
          href={link ?? '#'}
          className='flex items-center text-emsoft_light-main  p-3'
        >
          {content}
        </Link>
      )}
    </li>
  );
};

export default NavBarItem;

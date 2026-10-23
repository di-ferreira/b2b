'use client';
import { removeCookie } from '@/app/actions';
import {
  faCartShopping,
  faClipboardList,
  faHomeAlt,
  faPowerOff,
  faShoppingBag,
  faUser,
} from '@fortawesome/free-solid-svg-icons';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import NavBarItem, { iNavItem } from './NavBarItem';

interface Props {
  codeUser: string;
}

const NavBar = ({ codeUser }: Props) => {
  const router = useRouter();
  const [open, setOpen] = useState<boolean>(true);

  async function logOut() {
    await removeCookie('token_b2b');
    await removeCookie('user_b2b');
    await removeCookie('CIC');
    router.replace('/auth');
  }

  const customerLink = codeUser
    ? `/app/customer/${codeUser}`
    : '/app/dashboard';

  const linkList: iNavItem[] = [
    { icon: faHomeAlt, link: '/app/dashboard', text: 'Dashboard' },
    { icon: faUser, link: customerLink, text: 'Dados Cliente' },
    { icon: faShoppingBag, link: '/app/products', text: 'Produtos' },
    { icon: faClipboardList, link: '/app/pre-sales', text: 'Pré-Vendas' },
    { icon: faCartShopping, link: '/app/sales', text: 'Vendas' },
    { icon: faCartShopping, link: '/app/cart', text: 'Carrinho' },
    { icon: faPowerOff, onClick: logOut, text: 'LogOut' },
  ];

  return (
    <aside
      className={`flex transition-all overflow-hidden 
                  ${open ? ' w-52 ' : ' w-14  '} 
                  h-screen  
                  bg-emsoft_blue-main
                  border-t-0 border-r-2 border-emsoft_orange-main
                  md:w-14 md:hover:w-52`}
      onMouseOver={() => setOpen((curr) => true)}
      onMouseOut={() => setOpen((curr) => false)}
    >
      <ul className='flex flex-col w-full h-full'>
        {linkList.map((link, idx) => (
          <NavBarItem
            key={idx}
            icon={link.icon}
            link={link.link}
            onClick={link.onClick}
            text={link.text}
          />
        ))}
      </ul>
    </aside>
  );
};

export default NavBar;

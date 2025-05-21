import { iCliente } from '@/@types/Cliente';
import { create } from 'zustand';

type UserStore = {
  current: iCliente;
  setCurrent: (user: iCliente) => void;
};

const useUser = create<UserStore>((set) => ({
  current: {} as iCliente,
  setCurrent: (user: iCliente) => {
    set((state) => ({
      current: user,
    }));
  },
}));

export default useUser;


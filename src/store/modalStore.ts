import { create } from 'zustand';

interface ModalState {
  modals: Record<string, { isVisible: boolean; itemId: string | null }>; // Controla o estado e o item editado
  openModal: (itemId: string) => void;
  closeModal: (itemId: string) => void;
}

export const useModalStore = create<ModalState>((set) => ({
  modals: {},
  openModal: (itemId) =>
    set((state) => ({
      modals: { ...state.modals, [itemId]: { isVisible: true, itemId } },
    })),
  closeModal: () =>
    set((state) => ({
      modals: Object.fromEntries(
        Object.entries(state.modals).map(([key, value]) => [
          key,
          { ...value, isVisible: false },
        ])
      ),
    })),
}));


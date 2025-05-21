'use client';
import { ResponseType } from '@/@types';
import { iCliente } from '@/@types/Cliente';
import { iItemInserir, iItemRemove, iOrcamento } from '@/@types/Orcamento';
import { iVendedor } from '@/@types/Vendedor';
import {
  addItem,
  removeItem as removeAction,
  updateItem,
} from '@/app/actions/orcamento';
import { create } from 'zustand';

type OrcamentoStore = {
  current: iOrcamento;
  setCurrent: (orc: iOrcamento) => void;
  newItem: (itemOrcamento: iItemInserir) => Promise<ResponseType<iOrcamento>>;
  removeItem: (itemOrcamento: iItemRemove) => Promise<ResponseType<iOrcamento>>;
  updateItem: (
    itemOrcamento: iItemInserir
  ) => Promise<ResponseType<iOrcamento>>;
};

const useOrcamento = create<OrcamentoStore>((set) => ({
  current: {
    ORCAMENTO: 0,
    TOTAL: 0,
    VENDEDOR: {} as iVendedor,
    CLIENTE: {} as iCliente,
    ItensOrcamento: [],
  },
  setCurrent: (orc) => set({ current: orc }),
  newItem: async (itemOrcamento) => {
    const response = await addItem(itemOrcamento);
    if (response.value) set({ current: response.value });
    return response;
  },
  removeItem: async (itemOrcamento) => {
    const response = await removeAction(itemOrcamento);
    if (response.value) set({ current: response.value });
    return response;
  },
  updateItem: async (itemOrcamento) => {
    const response = await updateItem(itemOrcamento);
    if (response.value) set({ current: response.value });
    return response;
  },
}));

export default useOrcamento;


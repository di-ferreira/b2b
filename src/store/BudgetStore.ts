import { iItensOrcamento, iOrcamento } from '@/@types/Orcamento';
import { NewOrcamento, UpdateOrcamento } from '@/app/actions/orcamento';
import { create } from 'zustand';

type BudgetStore = {
  current: iOrcamento;
  isLoading: boolean;
  error: string | null;
  setCurrent: (budget: iOrcamento) => void;
  newBudget: (budget: iOrcamento) => Promise<void>;
  updateBudget: (budget: iOrcamento) => Promise<void>;
  addItem: (item: iItensOrcamento) => void;
  removeItem: (item: iItensOrcamento) => void;
  updateItem: (item: iItensOrcamento) => void;
};

const useBudget = create<BudgetStore>((set) => ({
  current: { ItensOrcamento: [] } as unknown as iOrcamento,
  isLoading: false,
  error: null,

  setCurrent: (budget) => set({ current: budget }),
  newBudget: async (budgetData: iOrcamento) => {
    set({ isLoading: true, error: null });
    try {
      const result = await NewOrcamento(budgetData);
      if (result.error) {
        throw new Error(result.error.message);
      }
      set({ current: result.value, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },
  updateBudget: async (budgetData: iOrcamento) => {
    set({ isLoading: true, error: null });
    try {
      const result = await UpdateOrcamento(budgetData);
      if (result.error) {
        throw new Error(result.error.message);
      }
      set({ current: result.value, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },
  addItem: (item: iItensOrcamento) => {
    set((state) => ({
      current: {
        ...state.current,
        ItensOrcamento: [...state.current.ItensOrcamento, item],
      },
    }));
  },
  removeItem: (item: iItensOrcamento) => {
    set((state) => ({
      current: {
        ...state.current,
        ItensOrcamento: state.current.ItensOrcamento.filter(
          (i) => i.PRODUTO.PRODUTO !== item.PRODUTO.PRODUTO,
        ),
      },
    }));
  },
  updateItem: (item: iItensOrcamento) => {
    set((state) => ({
      current: {
        ...state.current,
        ItensOrcamento: state.current.ItensOrcamento.map((i) =>
          i.PRODUTO.PRODUTO === item.PRODUTO.PRODUTO ? item : i,
        ),
      },
    }));
  },
}));

export default useBudget;


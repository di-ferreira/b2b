import { iCliente } from '@/@types/Cliente';
import {
  iEstoqueLoja,
  iListaSimilare,
  iProduto,
  iSaleHistory,
} from '@/@types/Produto';
import {
  GetEstoqueFiliais,
  GetNewPriceFromTable,
  GetProductPromotion,
  GetSaleHistory,
  GetSimilares,
  SearchProductsViaSQL,
} from '@/app/actions/produto';
import { create } from 'zustand';

type ProductStore = {
  productSelected: iProduto | null;
  searchResult: iProduto[];
  similares: iListaSimilare[];
  history: iSaleHistory[];
  estoqueFiliais: iEstoqueLoja[];
  isLoading: boolean;
  isOferta: boolean;
  currentPrice: number;

  // Cache para evitar re-chamadas desnecessárias
  cacheDetails: Record<
    string,
    {
      history: iSaleHistory[];
      similares: iListaSimilare[];
      estoqueFiliais: iEstoqueLoja[];
    }
  >;

  searchProducts: (word: string) => Promise<iProduto[]>;

  // Agora recebe o cliente para já disparar os detalhes
  selectProduct: (prod: iProduto, cliente: iCliente) => Promise<void>;

  clearDetails: () => void;
};

const useProductStore = create<ProductStore>((set, get) => ({
  productSelected: null,
  searchResult: [],
  similares: [],
  history: [],
  estoqueFiliais: [],
  isLoading: false,
  isOferta: false,
  currentPrice: 0,
  cacheDetails: {},

  clearDetails: () =>
    set({
      productSelected: null,
      similares: [],
      history: [],
      estoqueFiliais: [],
      isOferta: false,
      currentPrice: 0,
      cacheDetails: {},
    }),

  searchProducts: async (word) => {
    set({ isLoading: true });
    try {
      const response = await SearchProductsViaSQL(word.toUpperCase());
      const list = response.value?.value || [];
      set({ searchResult: list, isLoading: false });
      return list;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  selectProduct: async (prod, cliente) => {
    set({ isLoading: true, productSelected: prod });
    try {
      const cacheKey = `${cliente.CLIENTE}-${prod.PRODUTO}`;
      const cache = get().cacheDetails[cacheKey];

      const [promo, tablePriceResult] = await Promise.all([
        GetProductPromotion(prod),
        GetNewPriceFromTable(prod, cliente.Tabela),
      ]);

      let price = promo.value
        ? promo.value.OFERTA
        : tablePriceResult.value || prod.PRECO;
      let isOferta = !!promo.value;

      if (cache) {
        set({
          history: cache.history,
          similares: cache.similares,
          estoqueFiliais: cache.estoqueFiliais,
          currentPrice: price,
          isOferta: isOferta,
          isLoading: false,
        });
        return;
      }

      const [historyRes, simsRes, estoqueRes] = await Promise.all([
        GetSaleHistory(cliente, prod),
        GetSimilares(prod.PRODUTO),
        GetEstoqueFiliais(prod.PRODUTO),
      ]);

      let similaresFiltrados: iListaSimilare[] = [];
      if (simsRes.value !== undefined && simsRes.value !== null) {
        similaresFiltrados = simsRes.value.filter((similar) => {
          return (
            similar.EXTERNO.ATIVO !== 'N' &&
            similar.EXTERNO.VENDA !== 'N' &&
            similar.EXTERNO.TRANCAR !== 'S'
          );
        });
      }

      const history = historyRes.value || [];
      const similares = similaresFiltrados;
      const estoqueFiliais = estoqueRes.value || [];

      set((state) => ({
        history,
        similares,
        estoqueFiliais,
        currentPrice: price,
        isOferta,
        isLoading: false,
        cacheDetails: {
          ...state.cacheDetails,
          [cacheKey]: { history, similares, estoqueFiliais },
        },
      }));
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },
}));

export default useProductStore;


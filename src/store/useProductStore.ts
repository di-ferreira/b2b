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

  // Preço de tabela/promoção sem carregar histórico, similares e estoque
  getProductPrice: (
    prod: iProduto,
    cliente: iCliente,
  ) => Promise<{ price: number; isOferta: boolean }>;

  // Agora recebe o cliente para já disparar os detalhes
  selectProduct: (prod: iProduto, cliente: iCliente) => Promise<void>;

  clearDetails: () => void;
};

/**
 * Preço do produto na tabela do cliente, considerando promoção.
 * Nunca lança: usa o preço cadastrado do produto como último recurso.
 */
async function resolvePrice(prod: iProduto, cliente?: iCliente) {
  const [promo, tablePrice] = await Promise.allSettled([
    GetProductPromotion(prod),
    GetNewPriceFromTable(prod, cliente?.Tabela as string),
  ]);

  if (promo.status === 'rejected') {
    console.error('[resolvePrice] GetProductPromotion failed:', promo.reason);
  }

  if (tablePrice.status === 'rejected') {
    console.error('[resolvePrice] GetNewPriceFromTable failed:', tablePrice.reason);
  }

  const promotion = promo.status === 'fulfilled' ? promo.value.value : undefined;
  const tableValue =
    tablePrice.status === 'fulfilled' ? tablePrice.value.value : undefined;

  const offer = promotion?.OFERTA;
  const hasOffer = offer !== undefined && offer !== null;

  return {
    price: hasOffer ? Number(offer) : Number(tableValue || prod.PRECO || 0),
    isOferta: hasOffer,
  };
}

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

  getProductPrice: async (prod, cliente) => {
    const { price, isOferta } = await resolvePrice(prod, cliente);
    set({ currentPrice: price, isOferta });
    return { price, isOferta };
  },

  selectProduct: async (prod, cliente) => {
    set({ isLoading: true, productSelected: prod });
    try {
      const cacheKey = `${cliente?.CLIENTE}-${prod.PRODUTO}`;
      const cache = get().cacheDetails[cacheKey];

      const { price, isOferta } = await resolvePrice(prod, cliente);

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

      const [historyRes, simsRes, estoqueRes] = await Promise.allSettled([
        GetSaleHistory(cliente, prod),
        GetSimilares(prod.PRODUTO),
        GetEstoqueFiliais(prod.PRODUTO),
      ]);

      let similaresFiltrados: iListaSimilare[] = [];

      if (simsRes.status === 'fulfilled') {
        const similaresValue = simsRes.value.value;

        if (similaresValue !== undefined && similaresValue !== null) {
          similaresFiltrados = similaresValue.filter((similar) => {
            return (
              similar.EXTERNO.ATIVO !== 'N' &&
              similar.EXTERNO.VENDA !== 'N' &&
              similar.EXTERNO.TRANCAR !== 'S'
            );
          });
        }
      } else {
        console.error('[selectProduct] GetSimilares failed:', simsRes.reason);
      }

      const history =
        historyRes.status === 'fulfilled' ? historyRes.value.value || [] : [];
      const similares = similaresFiltrados;
      const estoqueFiliais =
        estoqueRes.status === 'fulfilled' ? estoqueRes.value.value || [] : [];

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


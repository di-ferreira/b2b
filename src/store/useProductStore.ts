import { iCliente } from '@/@types/Cliente';
import { iListaSimilare, iProduto, iSaleHistory } from '@/@types/Produto';
import {
  GetNewPriceFromTable,
  GetProductPromotion,
  GetProducts,
  GetSaleHistory,
  GetSimilares,
} from '@/app/actions/produto';
import { create } from 'zustand';

type ProductStore = {
  productSelected: iProduto | null;
  searchResult: iProduto[];
  similares: iListaSimilare[];
  history: iSaleHistory[];
  isLoading: boolean;
  isOferta: boolean;
  currentPrice: number;

  // Cache para evitar re-chamadas desnecessárias
  cacheDetails: Record<
    string,
    { history: iSaleHistory[]; similares: iListaSimilare[] }
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
  isLoading: false,
  isOferta: false,
  currentPrice: 0,
  cacheDetails: {},

  clearDetails: () =>
    set({
      productSelected: null,
      similares: [],
      history: [],
      isOferta: false,
      currentPrice: 0,
      cacheDetails: {},
    }),

  searchProducts: async (word) => {
    set({ isLoading: true });
    const response = await GetProducts({
      top: 50,
      skip: 0,
      orderBy: 'PRODUTO',
      filter: [
        { key: 'PRODUTO', value: word.toUpperCase(), typeSearch: 'like' },
        {
          key: 'REFERENCIA',
          value: word.toUpperCase(),
          typeSearch: 'like',
          typeCondition: 'or',
        },
        {
          key: 'NOME',
          value: word.toUpperCase(),
          typeSearch: 'like',
          typeCondition: 'or',
        },
        {
          key: 'APLICACOES',
          value: word.toUpperCase(),
          typeSearch: 'like',
          typeCondition: 'or',
        },
        {
          key: 'VENDA',
          value: 'S',
          typeCondition: 'or',
          typeSearch: 'eq',
          groupOperator: 'or',
        },
        {
          key: 'VENDA',
          value: null,
          typeCondition: 'or',
          typeSearch: 'eq',
          groupOperator: 'or',
        },
        { key: 'TRANCAR', value: 'N', typeCondition: 'and', typeSearch: 'eq' },
        { key: 'ATIVO', value: 'S', typeCondition: 'and', typeSearch: 'eq' },
      ],
    });

    const list = response.value?.value || [];
    set({ searchResult: list, isLoading: false });
    return list;
  },

  selectProduct: async (prod, cliente) => {
    set({ isLoading: true, productSelected: prod });

    const cacheKey = `${cliente.CLIENTE}-${prod.PRODUTO}`;
    const cache = get().cacheDetails[cacheKey];

    // Busca Preço e Oferta (Sempre buscar pois preço pode mudar rápido)
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
        currentPrice: price,
        isOferta: isOferta,
        isLoading: false,
      });
      return;
    }

    const [historyRes, simsRes] = await Promise.all([
      GetSaleHistory(cliente, prod),
      GetSimilares(prod.PRODUTO),
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

    // Atualiza estado e guarda no cache
    set((state) => ({
      history,
      similares,
      currentPrice: price,
      isOferta,
      isLoading: false,
      cacheDetails: {
        ...state.cacheDetails,
        [cacheKey]: { history, similares },
      },
    }));
  },
}));

export default useProductStore;


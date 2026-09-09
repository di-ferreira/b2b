import { iProduto } from '@/@types/Produto';
import { GetProduct } from '@/app/actions/produto';
import { Input } from '@/components/ui/input';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Link from 'next/link';

interface iProductPage {
  params: { id: string };
}

function parseCurrency(currency: number) {
  return currency.toLocaleString('pt-br', {
    style: 'currency',
    currency: 'BRL',
  });
}

const ProductDetail = async ({ params }: iProductPage) => {
  const productCode = params.id;
  const result = await GetProduct(productCode);

  if (!result.value) return <p>Failed to load product.</p>;

  const produto: iProduto = result.value;

  return (
    <section className='flex flex-col gap-4 w-full h-full'>
      <h1
        className={`flex gap-x-3 text-4xl font-bold mt-5 py-1 px-3 
          border-b-2 text-emsoft_dark-text
       border-emsoft_orange-main`}
      >
        Produto {produto.PRODUTO}
      </h1>

      <div className='flex gap-4 w-full h-full px-5 py-0 flex-wrap'>
        <Input
          labelText='NOME'
          labelPosition='top'
          value={produto.NOME}
          className='w-[35%] tablet-portrait:w-[45%]'
        />
        <Input
          labelText='REFERÊNCIA'
          labelPosition='top'
          value={produto.REFERENCIA}
          className='w-[20%] tablet-portrait:w-[45%]'
        />
        <Input
          labelText='CÓDIGO DE BARRAS'
          labelPosition='top'
          value={produto.CODIGOBARRA ?? '-'}
          className='w-[20%] tablet-portrait:w-[45%]'
        />
        <Input
          labelText='FABRICANTE'
          labelPosition='top'
          value={produto.FABRICANTE?.NOME ?? '-'}
          className='w-[20%] tablet-portrait:w-[45%]'
        />
        <Input
          labelText='GRUPO'
          labelPosition='top'
          value={produto.GRUPO?.NOME ?? '-'}
          className='w-[20%] tablet-portrait:w-[45%]'
        />
        <Input
          labelText='APLICAÇÕES'
          labelPosition='top'
          value={produto.APLICACOES || '-'}
          className='w-[45%] tablet-portrait:w-[45%]'
        />
        <Input
          labelText='ESTOQUE ATUAL'
          labelPosition='top'
          value={String(produto.QTDATUAL)}
          className='w-[15%] tablet-portrait:w-[20%]'
        />
        <Input
          labelText='LOCAL'
          labelPosition='top'
          value={produto.LOCAL ?? '-'}
          className='w-[15%] tablet-portrait:w-[20%]'
        />
        <Input
          labelText='PREÇO'
          labelPosition='top'
          value={parseCurrency(produto.PRECO)}
          className='w-[15%] tablet-portrait:w-[20%]'
        />
        <Input
          labelText='CURVA'
          labelPosition='top'
          value={produto.CURVA}
          className='w-[10%] tablet-portrait:w-[20%]'
        />
        <Input
          labelText='ATIVO'
          labelPosition='top'
          value={produto.ATIVO === 'S' ? 'SIM' : 'NÃO'}
          className='w-[10%] tablet-portrait:w-[20%]'
        />
        <Input
          labelText='UNIDADE'
          labelPosition='top'
          value={produto.UNIDADE?.Descricao ?? '-'}
          className='w-[10%] tablet-portrait:w-[20%]'
        />
      </div>

      <div className='flex gap-4 w-full px-5 py-0 flex-wrap justify-end'>
        <Link
          href={`/app/products`}
          className='text-red-700 hover:text-red-500 font-bold px-6 py-3'
        >
          <FontAwesomeIcon
            icon={faArrowLeft}
            size='xl'
            title='Voltar'
            className='mr-3'
          />
          Voltar
        </Link>
      </div>
    </section>
  );
};

export default ProductDetail;

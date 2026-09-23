import { iEstoqueLoja, iProduto } from '@/@types/Produto';
import { GetEstoqueFiliais, GetProduct } from '@/app/actions/produto';
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
  const [result, estoqueResult] = await Promise.all([
    GetProduct(productCode),
    GetEstoqueFiliais(productCode),
  ]);

  if (!result.value) return <p>Failed to load product.</p>;

  const produto: iProduto = result.value;
  const estoqueFiliais: iEstoqueLoja[] = estoqueResult.value || [];

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

      {estoqueFiliais.length > 0 && (
        <div className='w-full px-5'>
          <h2 className='text-lg font-bold text-emsoft_dark-text mb-2'>
            Estoque em Outras Filiais
          </h2>
          <div className='overflow-x-auto border rounded'>
            <table className='w-full text-sm'>
              <thead className='bg-gray-100'>
                <tr>
                  <th className='px-3 py-2 text-left font-bold'>FILIAL</th>
                  <th className='px-3 py-2 text-right font-bold'>ESTOQUE</th>
                  <th className='px-3 py-2 text-right font-bold'>PREÇO</th>
                  <th className='px-3 py-2 text-left font-bold'>LOCAL</th>
                  <th className='px-3 py-2 text-left font-bold'>ATUALIZAÇÃO</th>
                </tr>
              </thead>
              <tbody>
                {estoqueFiliais.map((filial, idx) => (
                  <tr key={idx} className='border-t'>
                    <td className='px-3 py-2 font-medium'>{filial.LOJA}</td>
                    <td className='px-3 py-2 text-right'>{filial.ESTOQUE}</td>
                    <td className='px-3 py-2 text-right'>
                      {parseCurrency(filial.PRECO)}
                    </td>
                    <td className='px-3 py-2'>{filial.LOCAL1}</td>
                    <td className='px-3 py-2 text-gray-500'>
                      {filial.ATUALIZACAO}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

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

import { LoadOrcamento } from '@/app/actions/orcamento';
import DataTableItensBudget from '@/components/budgets/budgetItens/DataTable';
import { Input } from '@/components/ui/input';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import dayjs from 'dayjs';
import Link from 'next/link';

const Budget = async () => {
  let budget = await LoadOrcamento();
  console.log('orçamento', budget);

  if (!budget.value) {
    // budget = await NewOrcamento();
  }

  if (!budget.value) return <p>Failed to load budget.</p>;

  return (
    <section className='flex flex-col w-full gap-4 h-full'>
      <h3
        className={`text-2xl font-bold mt-5 py-1 px-3 
          border-b-2 text-emsoft_dark-text
       border-emsoft_orange-main`}
      >
        Meu Carrinho Nº {budget.value.ORCAMENTO}
      </h3>

      <div className='flex w-full h-[75vh] flex-col overflow-x-hidden overflow-y-auto'>
        <div className='flex gap-3 w-full h-auto px-5 py-0 flex-wrap tablet-portrait:h-auto tablet-portrait:gap-y-6'>
          <Input
            labelText='Nº do Orcamento'
            labelPosition='top'
            value={budget.value.ORCAMENTO}
            className='w-[10%] h-7'
            inputClass=' text-right'
            disabled
          />
          <Input
            labelText='Data'
            labelPosition='top'
            value={dayjs(budget.value.DATA).format('DD/MM/YYYY')}
            className='w-[10%] h-7'
            inputClass=' text-right'
            disabled
          />
          <Input
            labelText='Total do Orçamento'
            labelPosition='top'
            value={budget.value.TOTAL.toLocaleString('pt-br', {
              style: 'currency',
              currency: 'BRL',
            })}
            className='w-[10%] h-7'
            inputClass=' text-right'
            disabled
          />
        </div>

        <div className='flex gap-4 w-full h-[80%] mt-[2%] tablet-portrait:h-[50%]'>
          <DataTableItensBudget orc={budget.value} />
        </div>
      </div>

      <div className='flex gap-4 w-full px-5 py-0 flex-wrap justify-end'>
        <Link
          href={`/app/dashboard`}
          className='text-red-700 hover:text-red-500 font-bold'
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

export default Budget;


import BannerCarousel from '@/components/BannerCarousel';
import DataTableBankSlip from '@/components/Dashboard/boletos/table';
import DataTableSaleAwaiting from '@/components/Dashboard/pre-sale/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import {
  faDollarSign,
  faFileInvoiceDollar,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const Dashboard = async () => {
  return (
    <div
      className={`flex flex-col w-full overflow-x-hidden overflow-y-auto  min-h-full bg-gray-300 p-4 gap-y-12`}
    >
      <section
        className={`flex flex-row w-full gap-x-12 tablet:flex-col tablet:gap-y-4`}
      >
        <Card
          className={`w-full h-[200px] p-3 tablet-landscape:flex tablet-landscape:items-center tablet-landscape:justify-evenly
                      tablet-portrait:flex tablet-portrait:items-center tablet-portrait:justify-evenly`}
        >
          <CardContent
            className={`font-bold tablet-landscape:text-2xl tablet-landscape:mt-5 p-0 mt-0`}
          >
            <BannerCarousel />
          </CardContent>
        </Card>
      </section>
      <section
        className={`flex flex-row w-full gap-x-4 tablet:flex-col tablet:gap-y-4 mt-[-1.5rem]`}
      >
        <Card
          className={`w-[50%] h-min p-3 tablet:w-full tablet:flex tablet:flex-col tablet:items-center`}
        >
          <CardHeader className='text-lg text-gray-600 p-0 flex-row items-center gap-x-3'>
            Boletos em aberto <FontAwesomeIcon icon={faFileInvoiceDollar} />
          </CardHeader>
          <CardDescription className='text-xs text-gray-500'>
            Boletos de pedidos anteriores
          </CardDescription>

          <CardContent className='font-bold mt-2 px-2 py-4 w-full'>
            <DataTableBankSlip />
          </CardContent>
          <CardFooter></CardFooter>
        </Card>
        <Card
          className={`w-[50%]  p-3  h-min tablet:w-full tablet:flex tablet:flex-col tablet:items-center`}
        >
          <CardHeader className='text-lg text-gray-600 p-0 flex-row items-center gap-x-3'>
            Pedidos aguardando faturamento
            <FontAwesomeIcon icon={faDollarSign} />
          </CardHeader>
          <CardDescription className='text-xs text-gray-500'>
            Resumo de pré-vendas em aberto
          </CardDescription>

          <CardContent className='flex flex-col mt-2 p-2 gap-y-2 w-full h-full'>
            <DataTableSaleAwaiting />
          </CardContent>
          <CardFooter></CardFooter>
        </Card>
      </section>
    </div>
  );
};

export default Dashboard;


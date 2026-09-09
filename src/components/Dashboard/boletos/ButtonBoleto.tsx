import { iContas } from '@/@types/Contas';
import { Button } from '@/components/ui/button';
import { faFilePdf } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Flip, toast } from 'react-toastify';

export default async function ButtonBoleto(conta: { conta: iContas }) {
  const handleDownload = async () => {
    let banco: string = conta.conta.EMISSAO_BOLETO || '';

    if (banco === 'CAIXA ECONOMICA') {
      banco = 'caixa';
    }
    banco = banco.toLocaleLowerCase().trim().replaceAll(' ', '');

    const url = `/api/boletos/${banco}/${conta.conta.CLIENTE.CIC}/${conta.conta.NOSSO_NUMERO}`;

    const response = await fetch(url);

    if (response.ok) {
      // Converte a resposta em blob e dispara download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Boleto_${conta.conta.CLIENTE.CIC}_${conta.conta.NOSSO_NUMERO}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } else {
      const data = await response.json();
      toast(data.error, {
        position: 'top-right',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: 'light',
        transition: Flip,
        type: 'error',
      });
    }
  };

  return (
    <span className='w-full h-full flex justify-center items-center'>
      <Button
        className='w-full h-8 flex items-center justify-center text-emsoft_light-main rounded-sm  bg-emsoft_orange-main hover:bg-emsoft_orange-light  tablet-portrait:h-14 tablet-portrait:text-2xl'
        onClick={() => handleDownload()}
      >
        <FontAwesomeIcon icon={faFilePdf} className='h-1/2 mr-4' />
        Download
      </Button>
    </span>
  );
}


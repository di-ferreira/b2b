'use client';
import { iOrcamento } from '@/@types/Orcamento';
import { Button } from '@/components/ui/button';
import { faEye, faSave } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as PDF from '@react-pdf/renderer';
import { useEffect, useState } from 'react';
import { styles } from './style';

export interface PdfViewerProps {
  orc: iOrcamento;
}

function PdfDocument({ orc }: PdfViewerProps) {
  if (!PDF) {
    return <div>Loading...</div>;
  }

  const { Document, Page, Image, Text, View } = PDF;

  const formatDate = (date: Date | number): string => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  };

  const DataAtual = formatDate(new Date());

  return (
    <Document language='PT-BR'>
      <Page size='A4' style={[styles.page]} wrap={true}>
        <View style={[styles.header, styles.default]}>
          <View style={styles.logo}>
            <Image
              src={`${window.location.protocol}//${window.location.host}/LogoAutosul.png`}
            />
          </View>

          <View style={styles.headerColumn}>
            <View style={styles.headerParagraph}>
              <Text style={styles.headerParagraphTitle}>data:</Text>
              <Text style={styles.headerParagraphValue}>{DataAtual}</Text>
            </View>

            <View style={styles.headerParagraph}>
              <Text style={styles.headerParagraphTitle}>cliente:</Text>
              <Text style={styles.headerParagraphValue}>
                {orc.CLIENTE.NOME}
              </Text>
            </View>

            <View style={styles.headerParagraph}>
              <Text style={styles.headerParagraphTitle}>vendedor:</Text>
              <Text style={styles.headerParagraphValue}>
                {orc.VENDEDOR.NOME}
              </Text>
            </View>

            <View style={styles.headerParagraph}>
              <Text style={styles.headerParagraphTitle}>nº orçamento:</Text>
              <Text style={styles.headerParagraphValue}>{orc.ORCAMENTO}</Text>
            </View>
          </View>
        </View>
        <View style={styles.headerLine}></View>
        {/* Cabeçalho da Tabela */}
        <View style={[styles.tableRow, styles.tableHeader, styles.default]}>
          <View style={styles.tableColProd}>
            <Text style={styles.tableCell}>Produto</Text>
          </View>
          <View style={styles.tableColQtd}>
            <Text style={styles.tableCell}>Qtd</Text>
          </View>
          <View style={styles.tableColDesc}>
            <Text style={styles.tableCell}>Descrição</Text>
          </View>
          <View style={styles.tableColValor}>
            <Text style={styles.tableCell}>Valor</Text>
          </View>
          <View style={styles.tableColTotal}>
            <Text style={styles.tableCell}>Total</Text>
          </View>
        </View>

        {/* Linhas da Tabela */}
        {orc.ItensOrcamento.map((item, idx) => (
          <View
            key={idx}
            wrap={false}
            style={[styles.tableRow, styles.default, styles.tableBody]}
          >
            <View style={styles.tableColProd}>
              <Text style={styles.tableCell}>{item.PRODUTO.PRODUTO}</Text>
            </View>
            <View style={styles.tableColQtd}>
              <Text style={styles.tableCell}>{item.QTD}</Text>
            </View>
            <View style={styles.tableColDesc}>
              <Text style={styles.tableCell}>{item.PRODUTO.APLICACOES}</Text>
            </View>
            <View style={styles.tableColValor}>
              <Text style={styles.tableCell}>
                {item.VALOR.toLocaleString('pt-br', {
                  style: 'currency',
                  currency: 'BRL',
                })}
              </Text>
            </View>
            <View style={styles.tableColTotal}>
              <Text style={styles.tableCell}>
                {item.TOTAL.toLocaleString('pt-br', {
                  style: 'currency',
                  currency: 'BRL',
                })}
              </Text>
            </View>
          </View>
        ))}
        {/*TOTAL*/}
        <View style={styles.total}>
          <Text>TOTAL:</Text>
          <Text>__________________________________________</Text>

          <Text>
            {orc.TOTAL.toLocaleString('pt-br', {
              style: 'currency',
              currency: 'BRL',
            })}
          </Text>
        </View>

        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) =>
            `${pageNumber} / ${totalPages}`
          }
          fixed
        />
      </Page>
    </Document>
  );
}

export function PdfViewer({ orc }: PdfViewerProps) {
  const [PDFRenderer, setPDFRenderer] = useState<any>(null);

  useEffect(() => {
    const loadPDFRenderer = async () => {
      if (typeof window !== 'undefined') {
        const pdfRenderer = await import('@react-pdf/renderer');
        setPDFRenderer(pdfRenderer);

        pdfRenderer.Font.register({
          family: 'Montserrat',
          fonts: [
            {
              src: `${window.location.protocol}//${window.location.host}/assets/fonts/montserrat/Montserrat-Regular.ttf`,
            },
            {
              src: `${window.location.protocol}//${window.location.host}/assets/fonts/montserrat/Montserrat-Medium.ttf`,
              fontStyle: 'normal',
              fontWeight: 500,
            },
            {
              src: `${window.location.protocol}//${window.location.host}/assets/fonts/montserrat/Montserrat-Bold.ttf`,
              fontWeight: 700,
            },
          ],
        });
      }
    };
    loadPDFRenderer();
  }, []);

  if (!PDFRenderer) {
    return <div>Loading...</div>;
  }

  const { PDFViewer } = PDFRenderer;

  return (
    <PDFViewer width={'100%'} height={'100%'} showToolbar={true}>
      <PdfDocument orc={orc} />
    </PDFViewer>
  );
}

export function OpenPDF({ orc }: PdfViewerProps) {
  const handleOpenPDF = async () => {
    if (typeof window !== 'undefined') {
      const { pdf } = await import('@react-pdf/renderer');
      const blob = await pdf(<PdfDocument orc={orc} />).toBlob();
      const pdfUrl = URL.createObjectURL(blob);
      window.open(pdfUrl, '_blank');
    }
  };

  return (
    <Button onClick={handleOpenPDF}>
      <FontAwesomeIcon
        icon={faEye}
        className={'text-emsoft_light-main mr-2'}
        size='xl'
        title={'Gerar Pré-venda'}
      />
      Visualizar PDF
    </Button>
  );
}

export function DownloadPDF({ orc }: PdfViewerProps) {
  const handleDownloadPDF = async () => {
    const { pdf } = await import('@react-pdf/renderer');
    const blob = await pdf(<PdfDocument orc={orc} />).toBlob();
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `orcamento-${orc.ORCAMENTO}-${orc.CLIENTE.NOME}.pdf`;
    link.click();
  };

  return (
    <Button onClick={handleDownloadPDF}>
      <FontAwesomeIcon
        icon={faSave}
        className={'text-emsoft_light-main mr-2'}
        size='xl'
        title={'Gerar Pré-venda'}
      />
      Salvar PDF
    </Button>
  );
}


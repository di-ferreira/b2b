'use client';
import { StyleSheet } from '@react-pdf/renderer';

export const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    paddingTop: 35,
    paddingBottom: 35,
    color: '#111',
    border: '1px solid #000',
    fontWeight: 'medium',
  },
  default: {
    width: '100%',
  },
  logo: {
    width: '130px',
    height: 'auto',
    minHeight: '65px',
    marginTop: '5px',
    marginLeft: '5px',
  },
  header: {
    marginLeft: 20,
    marginRight: 20,
    columnGap: '15px',
    flexDirection: 'row',
    fontSize: '12px',
  },
  headerColumn: {
    flexDirection: 'column',
    rowGap: '10px',
    marginVertical: '5px',
  },
  headerParagraph: { flexDirection: 'row', columnGap: '3px' },
  headerParagraphTitle: {
    textTransform: 'capitalize',
  },
  headerParagraphValue: {
    borderBottom: '1px solid #000',
    paddingLeft: '3px',
    paddingRight: '15px',
    textOverflow: 'ellipsis',
    fontWeight: 700,
    paddingBottom: 3,
  },
  headerLine: {
    margin: '5px 0',
    backgroundColor: '#000',
    height: '2px',
  },
  body: {
    width: '100%',
    height: '100%',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  table: {
    display: 'flex',
    width: 'auto',
  },
  tableBody: {
    height: '90%',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: 'solid 1px #000',
    maxHeight: '35px',
    overflow: 'hidden',
    marginLeft: 20,
    marginRight: 20,
    fontSize: 12,
  },
  tableColProd: {
    width: '15%',
    padding: 5,
    textAlign: 'center',
  },
  tableColQtd: {
    width: '10%',
    padding: 5,
    textAlign: 'center',
  },
  tableColDesc: {
    width: '30%',
    padding: 5,
    textOverflow: 'ellipsis',
  },
  tableColValor: {
    width: '15%',
    padding: 5,
    textAlign: 'right',
  },
  tableColTotal: {
    width: '20%',
    padding: 5,
    textAlign: 'right',
  },
  tableCell: {
    fontSize: 10,
    textOverflow: 'ellipsis',
  },
  tableHeader: {
    backgroundColor: '#f0f0f0',
    fontWeight: 'bold',
  },
  total: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: '14px',
    marginLeft: 20,
    marginRight: 20,
    padding: 5,
  },
  pageNumber: {
    position: 'absolute',
    fontSize: 12,
    bottom: 15,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: '#111',
  },
});


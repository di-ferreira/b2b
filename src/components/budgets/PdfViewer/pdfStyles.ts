export const styles = {
  page: {
    flexDirection: 'column',
    marginLeft: 25,
    marginRight: 25,
    marginTop: 20,
    marginBottom: 20,
    fontFamily: 'Montserrat',
  },
  default: {
    width: '90%',
    height: '95%',
    fontWeight: 'medium',
    color: '#111',
    border: '1px solid #000',
    position: 'relative',
  },
  logo: {
    width: '130px',
    height: 'auto',
    minHeight: '65px',
    marginTop: '5px',
    marginLeft: '5px',
  },
  header: {
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
  tableRow: {
    flexDirection: 'row',
    borderBottom: 'solid 1px #000',
    maxHeight: '35px',
    overflow: 'hidden',
  },
  tableColProd: {
    width: '25%',
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
    fontSize: 12,
  },
  tableHeader: {
    backgroundColor: '#f0f0f0',
    fontWeight: 'bold',
  },
  total: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: '14px',
    padding: 5,
  },
};


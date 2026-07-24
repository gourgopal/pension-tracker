import * as pdfjsLib from 'pdfjs-dist';
import { EPFData, Transaction } from './types';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export const parseEPFPassbook = async (file: File, password?: string): Promise<EPFData> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({
    data: arrayBuffer,
    password: password,
    standardFontDataUrl: `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/standard_fonts/`,
  }).promise;
  
  let fullText = "";
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map((item: any) => item.str);
    fullText += strings.join(" ") + "\n";
  }
  
  return extractDataFromText(fullText);
};

const extractDataFromText = (text: string): EPFData => {
  const data: EPFData = {
    establishmentId: '',
    establishmentName: '',
    memberId: '',
    memberName: '',
    uan: '',
    dob: '',
    openingBalanceEE: 0,
    openingBalanceER: 0,
    openingBalanceEPS: 0,
    transactions: []
  };

  const estMatch = text.match(/Establishment ID\/Name\s+([A-Z0-9]+)\s*\/\s*(.*?)\s+(?:lnL|Member)/i);
  if (estMatch) {
    data.establishmentId = estMatch[1].trim();
    data.establishmentName = estMatch[2].trim();
  }

  const memberMatch = text.match(/Member ID\/Name\s+([A-Z0-9]+)\s*\/\s*(.*?)\s+(?:tUe|Date)/i);
  if (memberMatch) {
    data.memberId = memberMatch[1].trim();
    data.memberName = memberMatch[2].trim();
  }

  const uanMatch = text.match(/UAN\s*[:\|]?\s*(\d{12})/i);
  if (uanMatch) data.uan = uanMatch[1];

  const dobMatch = text.match(/Date of Birth\s*[:\|]?\s*(\d{2}-\d{2}-\d{4})/i);
  if (dobMatch) data.dob = dobMatch[1];

  const parseAmt = (str: string) => parseFloat(str.replace(/,/g, '')) || 0;

  const obMatch = text.match(/OB Int\. Updated upto \d{2}\/\d{2}\/\d{4}\s+([\d,]+)\s+([\d,]+)\s+([\d,]+)/i);
  if (obMatch) {
    data.openingBalanceEE = parseAmt(obMatch[1]);
    data.openingBalanceER = parseAmt(obMatch[2]);
    data.openingBalanceEPS = parseAmt(obMatch[3]);
  }
  
  const txnRegex = /([a-z]{3}-\d{4})\s+(\d{2}-\d{2}-\d{4})\s+(CR|DR)\s+(.+?)\s+([\d,]+)\s+([\d,]+)\s+([\d,]+)\s+([\d,]+)\s+([\d,]+)/gi;
  let txnMatch;
  while ((txnMatch = txnRegex.exec(text)) !== null) {
    const isDebit = txnMatch[3].toUpperCase() === 'DR';
    const multiplier = isDebit ? -1 : 1;

    data.transactions.push({
      wageMonth: txnMatch[1],
      date: txnMatch[2],
      particulars: txnMatch[4].trim(),
      epfWage: parseAmt(txnMatch[5]),
      epsWage: parseAmt(txnMatch[6]),
      eeShare: parseAmt(txnMatch[7]) * multiplier,
      erShare: parseAmt(txnMatch[8]) * multiplier,
      epsShare: parseAmt(txnMatch[9]) * multiplier,
      isInterest: false
    });
  }
  
  const interestRegex = /(?<!OB )Int\. Updated upto \d{2}\/\d{2}\/\d{4}\s+([\d,]+)\s+([\d,]+)\s+([\d,]+)/gi;
  let interestMatch;
  while ((interestMatch = interestRegex.exec(text)) !== null) {
    data.transactions.push({
      date: 'Year End',
      wageMonth: 'Annual',
      particulars: 'Interest Credited',
      epfWage: 0,
      epsWage: 0,
      eeShare: parseAmt(interestMatch[1]),
      erShare: parseAmt(interestMatch[2]),
      epsShare: parseAmt(interestMatch[3]),
      isInterest: true
    });
  }

  return data;
};



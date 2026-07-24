import * as pdfjsLib from 'pdfjs-dist';
import { EPFData, Transaction } from './types';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export const parseEPFPassbook = async (file: File): Promise<EPFData> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({
    data: arrayBuffer,
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
  const lines = text.split('\n');
  
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

  const estRegex = /Establishment ID\/Name\s*\|\s*([A-Z0-9]+)\s*\/\s*(.*)/i;
  const memberRegex = /Member ID\/Name\s*\|\s*([A-Z0-9]+)\s*\/\s*(.*)/i;
  
  const parseAmt = (str: string) => parseFloat(str.replace(/,/g, '')) || 0;

  for (const line of lines) {
    if (estRegex.test(line)) {
      const match = line.match(estRegex);
      if (match) {
        data.establishmentId = match[1].trim();
        data.establishmentName = match[2].trim();
      }
    } else if (memberRegex.test(line)) {
      const match = line.match(memberRegex);
      if (match) {
        data.memberId = match[1].trim();
        data.memberName = match[2].trim();
      }
    } else if (line.includes("UAN")) {
      const match = line.match(/UAN\s*[:\|]?\s*(\d{12})/i);
      if (match) data.uan = match[1];
    } else if (line.includes("Date of Birth")) {
      const match = line.match(/Date of Birth\s*[:\|]?\s*(\d{2}-\d{2}-\d{4})/i);
      if (match) data.dob = match[1];
    } else if (line.includes("OB Int. Updated upto")) {
      const match = line.match(/OB Int\. Updated upto \d{2}\/\d{2}\/\d{4}\s+([\d,]+)\s+([\d,]+)\s+([\d,]+)/i);
      // We only want the first opening balance if multiple years are present
      if (match && data.openingBalanceEE === 0 && data.openingBalanceER === 0) {
        data.openingBalanceEE = parseAmt(match[1]);
        data.openingBalanceER = parseAmt(match[2]);
        data.openingBalanceEPS = parseAmt(match[3]);
      }
    }
    
    // WageMonth Date Type Particulars EPFWage EPSWage EE ER EPS
    const txnMatch = line.match(/([a-z]{3}-\d{4})\s+(\d{2}-\d{2}-\d{4})\s+(CR|DR)\s+(.+?)\s+([\d,]+)\s+([\d,]+)\s+([\d,]+)\s+([\d,]+)\s+([\d,]+)/i);
    if (txnMatch) {
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
    
    // Interest lines: Int. Updated upto 31/03/2026   52,056   42,886   0
    const interestMatch = line.trim().match(/^Int\. Updated upto \d{2}\/\d{2}\/\d{4}\s+([\d,]+)\s+([\d,]+)\s+([\d,]+)/i);
    if (interestMatch) {
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
  }

  // If no transactions found (mock parsing for now, user can manually enter data)
  
  return data;
};



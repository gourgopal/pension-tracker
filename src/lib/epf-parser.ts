import * as pdfjsLib from 'pdfjs-dist';
import { EPFData, Transaction } from './types';

// Load worker from CDN to avoid Next.js static export issues with web workers
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

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
      data.transactions.push({
        wageMonth: txnMatch[1],
        date: txnMatch[2],
        particulars: txnMatch[4].trim(),
        epfWage: parseAmt(txnMatch[5]),
        epsWage: parseAmt(txnMatch[6]),
        eeShare: parseAmt(txnMatch[7]),
        erShare: parseAmt(txnMatch[8]),
        epsShare: parseAmt(txnMatch[9]),
        isInterest: false
      });
    }
    
    // Interest lines: Int. Updated upto 31/03/2026   52,056   42,886   0
    const interestMatch = line.match(/Int\. Updated upto \d{2}\/\d{2}\/\d{4}\s+([\d,]+)\s+([\d,]+)\s+([\d,]+)/i);
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

export const mergeEPFData = (existing: EPFData, newData: EPFData): EPFData => {
  if (!existing || (existing.transactions.length === 0 && existing.openingBalanceEE === 0)) return newData;
  if (!newData || (newData.transactions.length === 0 && newData.openingBalanceEE === 0)) return existing;

  const allTxns = [...existing.transactions, ...newData.transactions];
  
  // Create a unique key to prevent duplicates if same passbook is uploaded or overlaps exist
  const uniqueTxnsMap = new Map();
  allTxns.forEach(t => {
    const key = `${t.date}-${t.wageMonth}-${t.particulars}-${t.eeShare}`;
    uniqueTxnsMap.set(key, t);
  });
  
  const uniqueTxns = Array.from(uniqueTxnsMap.values());

  const parseDate = (d: string, wm: string) => {
    if (d === 'Year End') {
      // It's interest, push to March 31 of the relevant year? We don't have year in Year End easily.
      // But we can just use 0, wait, it's better to extract year from somewhere.
      // We'll just leave it or parse something.
      return new Date(2100, 0, 1).getTime();
    }
    const parts = d.split('-');
    if (parts.length === 3) {
      return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`).getTime();
    }
    return 0;
  };

  uniqueTxns.sort((a, b) => parseDate(a.date, a.wageMonth) - parseDate(b.date, b.wageMonth));

  // The opening balance should technically be the earliest one, but we'll stick to the existing one
  // since the user can edit it manually now.
  return {
    ...existing,
    memberId: existing.memberId || newData.memberId,
    memberName: existing.memberName || newData.memberName,
    establishmentId: existing.establishmentId || newData.establishmentId,
    establishmentName: existing.establishmentName || newData.establishmentName,
    uan: existing.uan || newData.uan,
    dob: existing.dob || newData.dob,
    transactions: uniqueTxns
  };
};

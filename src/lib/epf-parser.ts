import * as pdfjsLib from 'pdfjs-dist';
import { EPFData, Transaction } from './types';

// Load worker from CDN to avoid Next.js static export issues with web workers
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

export const parseEPFPassbook = async (file: File): Promise<EPFData> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  
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
    }
    
    // In a real scenario, this would parse tables. We simulate finding transaction lines.
    // A typical transaction line: Date  WageMonth  Particulars  EPFWage EPSWage  EE  ER  EPS
    // This regex looks for a date followed by month-year
    const txnMatch = line.match(/(\d{2}-\d{2}-\d{4})\s+([A-Z]{3}-\d{4})\s+(.+?)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/i);
    if (txnMatch) {
      data.transactions.push({
        date: txnMatch[1],
        wageMonth: txnMatch[2],
        particulars: txnMatch[3].trim(),
        epfWage: parseFloat(txnMatch[4]),
        epsWage: parseFloat(txnMatch[5]),
        eeShare: parseFloat(txnMatch[6]),
        erShare: parseFloat(txnMatch[7]),
        epsShare: parseFloat(txnMatch[8]),
        isInterest: false
      });
    }
    
    const interestMatch = line.match(/Int\. Updated upto.*?(\d+)\s+(\d+)/i);
    if (interestMatch) {
      data.transactions.push({
        date: 'Year End',
        wageMonth: 'Annual',
        particulars: 'Interest Credited',
        epfWage: 0,
        epsWage: 0,
        eeShare: parseFloat(interestMatch[1]),
        erShare: parseFloat(interestMatch[2]),
        epsShare: 0,
        isInterest: true
      });
    }
  }

  // If no transactions found (mock parsing for now, user can manually enter data)
  
  return data;
};

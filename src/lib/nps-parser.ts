import * as pdfjsLib from 'pdfjs-dist';
import { NPSAccount } from './types';
import { v4 as uuidv4 } from 'uuid';

export const parseNPSPassbook = async (file: File, password?: string): Promise<NPSAccount> => {
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
  
  return extractNPSDataFromText(fullText);
};

const extractNPSDataFromText = (text: string): NPSAccount => {
  const data: NPSAccount = {
    id: uuidv4(),
    type: 'NPS',
    name: 'My NPS Account',
    pran: '',
    subscriberName: '',
    openingBalanceTier1: 0,
    openingBalanceTier2: 0,
    transactions: []
  };

  // Simple stub for now. Real NPS statements have different structures.
  const pranMatch = text.match(/PRAN\s*[:\-]?\s*(\d{12})/i);
  if (pranMatch) data.pran = pranMatch[1];
  
  const nameMatch = text.match(/Name of Subscriber\s*[:\-]?\s*(.*?)(?=\n|PRAN|Tier)/i);
  if (nameMatch) {
    data.subscriberName = nameMatch[1].trim();
    data.name = `NPS - ${data.subscriberName}`;
  }

  // Attempt to extract 'Value of your Holdings'
  // Depending on how pdf.js extracts the table (row-by-row vs column-by-column)
  // If row-by-row, the headers (A) (B) (C) D=(A-B)+C are printed, followed by the values starting with Holding.
  const rowMatch = text.match(/D=\(A-B\)\+C\s*([\d,\.]+)/);
  if (rowMatch) {
    data.openingBalanceTier1 = parseFloat(rowMatch[1].replace(/,/g, '')) || 0;
  } else {
    // If column-by-column, (A) is directly followed by the holding value
    const colMatch = text.match(/\(A\)\s*([\d,\.]+)/);
    if (colMatch) {
      data.openingBalanceTier1 = parseFloat(colMatch[1].replace(/,/g, '')) || 0;
    } else {
      // Fallback, try to find a large number after "Value of your Holdings" skipping the date
      const explicitMatch = text.match(/Value of your Holdings(?:.|\n)*?\(in Rs\)(?:.|\n)*?(?:D=\(A-B\)\+C|\(A\))(?:.|\n)*?([\d,\.]+)/i);
      if (explicitMatch) {
        data.openingBalanceTier1 = parseFloat(explicitMatch[1].replace(/,/g, '')) || 0;
      }
    }
  }

  // TODO: Implement actual parsing of Tier 1 & 2 balances and transactions.
  // Because NPS statements vary wildly between CRA providers (Protean vs KFintech), 
  // we will add more robust regexes once we see a sample.
  
  return data;
};

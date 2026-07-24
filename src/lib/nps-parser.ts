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
  // Often it comes in a table format: (A) ... 343630.01
  const holdingMatch = text.match(/\(A\)\s+([\d,\.]+)/);
  if (holdingMatch) {
    data.openingBalanceTier1 = parseFloat(holdingMatch[1].replace(/,/g, '')) || 0;
  } else {
    // Try matching explicitly
    const explicitMatch = text.match(/Value of your Holdings.*?([\d,\.]+)(?=\s|$)/i);
    if (explicitMatch) {
      data.openingBalanceTier1 = parseFloat(explicitMatch[1].replace(/,/g, '')) || 0;
    }
  }

  // TODO: Implement actual parsing of Tier 1 & 2 balances and transactions.
  // Because NPS statements vary wildly between CRA providers (Protean vs KFintech), 
  // we will add more robust regexes once we see a sample.
  
  return data;
};

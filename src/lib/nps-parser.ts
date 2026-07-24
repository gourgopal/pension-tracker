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
  // The table headers usually end with "D=(A-B)+C" and "Return on Investment (XIRR)"
  // The values follow immediately after.
  let foundHolding = false;
  
  const keywords = ["Return on Investment (XIRR)", "D=(A-B)+C", "(A) No of Contributions"];
  
  for (const keyword of keywords) {
    const idx = text.indexOf(keyword);
    if (idx !== -1) {
      const afterStr = text.substring(idx + keyword.length).trim();
      const tokens = afterStr.split(/\s+/);
      
      for (const token of tokens) {
        // Skip text tokens, percentages, and NA
        if (token.includes('%') || token.includes('N.A.') || token === '-') continue;
        if (isNaN(parseFloat(token.charAt(0)))) continue; // Fast check if it starts with a number
        
        const cleanToken = token.replace(/,/g, '');
        const val = parseFloat(cleanToken);
        // Ensure it's a valid number and > 1000 to avoid matching stray date numbers (like 8, 30) if layout is very weird
        // Holdings are typically larger than a few thousands
        if (!isNaN(val) && val > 1000) {
          data.openingBalanceTier1 = val;
          foundHolding = true;
          break;
        }
      }
    }
    if (foundHolding) break;
  }

  // TODO: Implement actual parsing of Tier 1 & 2 balances and transactions.
  // Because NPS statements vary wildly between CRA providers (Protean vs KFintech), 
  // we will add more robust regexes once we see a sample.
  
  return data;
};

const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');

async function test() {
  const loadingTask = pdfjsLib.getDocument('C:\\Users\\GouraGopalDalai\\Downloads\\DLCPM30086310000010006_2025.pdf');
  const pdfDocument = await loadingTask.promise;
  let fullText = "";
  for (let i = 1; i <= pdfDocument.numPages; i++) {
    const page = await pdfDocument.getPage(i);
    const textContent = await page.getTextContent();
    const strings = textContent.items.map(item => item.str);
    fullText += strings.join(" ") + "\n";
  }
  
  const estMatch = fullText.match(/Establishment ID\/Name\s*\|\s*([A-Z0-9]+)\s*\/\s*(.*?)\s+Member ID/i);
  console.log("Est Match:", estMatch ? [estMatch[1], estMatch[2]] : 'null');
  
  const memberMatch = fullText.match(/Member ID\/Name\s*\|\s*([A-Z0-9]+)\s*\/\s*(.*?)\s+Date of Birth/i);
  console.log("Member Match:", memberMatch ? [memberMatch[1], memberMatch[2]] : 'null');
  
  const uanMatch = fullText.match(/UAN\s*[:\|]?\s*(\d{12})/i);
  console.log("UAN Match:", uanMatch ? uanMatch[1] : 'null');
  
  const obMatch = fullText.match(/OB Int\. Updated upto \d{2}\/\d{2}\/\d{4}\s+([\d,]+)\s+([\d,]+)\s+([\d,]+)/i);
  console.log("OB Match:", obMatch ? [obMatch[1], obMatch[2], obMatch[3]] : 'null');
  
  const txnRegex = /([a-z]{3}-\d{4})\s+(\d{2}-\d{2}-\d{4})\s+(CR|DR)\s+(.+?)\s+([\d,]+)\s+([\d,]+)\s+([\d,]+)\s+([\d,]+)\s+([\d,]+)/gi;
  let txns = [];
  let match;
  while ((match = txnRegex.exec(fullText)) !== null) {
    txns.push(match[1]);
  }
  console.log("Found txns:", txns.length);
  
}
test().catch(console.error);

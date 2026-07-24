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
  
  const estMatch = fullText.match(/Establishment ID\/Name\s+([A-Z0-9]+)\s*\/\s*(.*?)\s+(?:lnL|Member)/i);
  console.log("Est Match:", estMatch ? [estMatch[1], estMatch[2]] : 'null');
  
  const memberMatch = fullText.match(/Member ID\/Name\s+([A-Z0-9]+)\s*\/\s*(.*?)\s+(?:tUe|Date)/i);
  console.log("Member Match:", memberMatch ? [memberMatch[1], memberMatch[2]] : 'null');
}
test().catch(console.error);

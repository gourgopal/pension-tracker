const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');

async function test() {
  const loadingTask = pdfjsLib.getDocument('C:\\Users\\GouraGopalDalai\\Downloads\\DLCPM30086310000010006_2025.pdf');
  const pdfDocument = await loadingTask.promise;
  const page = await pdfDocument.getPage(1);
  const textContent = await page.getTextContent();
  const strings = textContent.items.map(item => item.str);
  console.log("Raw items length:", strings.length);
  console.log("First 20 strings:", strings.slice(0, 20).join("|"));
  
  // Let's also test the exact code used in epf-parser.ts
  let fullText = strings.join(" ") + "\n";
  const lines = fullText.split('\n');
  
  const txnRegex = /([a-z]{3}-\d{4})\s+(\d{2}-\d{2}-\d{4})\s+(CR|DR)\s+(.+?)\s+([\d,]+)\s+([\d,]+)\s+([\d,]+)\s+([\d,]+)\s+([\d,]+)/i;
  
  const obRegex = /OB Int\. Updated upto \d{2}\/\d{2}\/\d{4}\s+([\d,]+)\s+([\d,]+)\s+([\d,]+)/i;
  
  console.log("Global match test for txns:", fullText.match(new RegExp(txnRegex.source, 'gi')));
  console.log("OB match:", fullText.match(obRegex));
}
test().catch(console.error);

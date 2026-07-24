const fs = require('fs');

const files = [
    'C:\\Users\\GouraGopalDalai\\Downloads\\GNGGN00287220000010475.pdf',
    'C:\\Users\\GouraGopalDalai\\Downloads\\DLCPM30086310000010006_2025.pdf',
    'C:\\Users\\GouraGopalDalai\\Downloads\\DLCPM38048510000010011_2026.pdf',
];

async function parse() {
    const pdfjsLib = await import('pdfjs-dist/build/pdf.mjs');
    
    // Set standard font data path if needed (might not be needed for simple text)
    // pdfjsLib.GlobalWorkerOptions.workerSrc = 'pdfjs-dist/build/pdf.worker.mjs';

    for (let f of files) {
        if (!fs.existsSync(f)) {
            console.log("File not found:", f);
            continue;
        }
        console.log("============================");
        console.log("File:", f);
        console.log("----------------------------");
        const data = new Uint8Array(fs.readFileSync(f));
        const loadingTask = pdfjsLib.getDocument({ data, useSystemFonts: true });
        const pdf = await loadingTask.promise;
        let fullText = "";
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            const pageText = content.items.map((item) => item.str).join(" ");
            fullText += pageText + "\n";
        }
        console.log(fullText.substring(0, 1500)); // Log first 1500 chars to see structure
        console.log("============================\n");
    }
}

parse().catch(console.error);

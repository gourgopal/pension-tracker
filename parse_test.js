const fs = require('fs');
const pdf = require('pdf-parse');

const files = [
    'C:\\Users\\GouraGopalDalai\\Downloads\\GNGGN00287220000010475.pdf',
    'C:\\Users\\GouraGopalDalai\\Downloads\\DLCPM30086310000010006_2025.pdf',
    'C:\\Users\\GouraGopalDalai\\Downloads\\DLCPM38048510000010011_2026.pdf',
];

async function parse() {
    for (let f of files) {
        if (!fs.existsSync(f)) {
            console.log("File not found:", f);
            continue;
        }
        let dataBuffer = fs.readFileSync(f);
        let data = await pdf(dataBuffer);
        console.log("============================");
        console.log("File:", f);
        console.log("----------------------------");
        console.log(data.text);
        console.log("============================\n");
    }
}

parse().catch(console.error);

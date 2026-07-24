const text1 = "OB Int. Updated upto 31/03/2025   5,26,592   4,23,129   23,750";
const text2 = "Int. Updated upto 31/03/2026   52,056   42,886   0";

const regex = /(?<!OB )Int\. Updated upto \d{2}\/\d{2}\/\d{4}\s+([\d,]+)\s+([\d,]+)\s+([\d,]+)/gi;

console.log("text1 match:", text1.match(regex));
console.log("text2 match:", text2.match(regex));

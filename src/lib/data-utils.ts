import { EPFData } from "./types";

export const mergeEPFData = (existing: EPFData, newData: EPFData): EPFData => {
  if (!existing || (existing.transactions.length === 0 && existing.openingBalanceEE === 0)) return newData;
  if (!newData || (newData.transactions.length === 0 && newData.openingBalanceEE === 0)) return existing;

  const allTxns = [...existing.transactions, ...newData.transactions];
  
  // Create a unique key to prevent duplicates if same passbook is uploaded or overlaps exist
  const uniqueTxnsMap = new Map();
  allTxns.forEach(t => {
    const key = `${t.date}-${t.wageMonth}-${t.particulars}-${t.eeShare}`;
    uniqueTxnsMap.set(key, t);
  });
  
  const uniqueTxns = Array.from(uniqueTxnsMap.values());

  const parseDate = (d: string, wm: string) => {
    if (d === 'Year End') {
      return new Date(2100, 0, 1).getTime();
    }
    const parts = d.split('-');
    if (parts.length === 3) {
      return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`).getTime();
    }
    return 0;
  };

  uniqueTxns.sort((a, b) => parseDate(a.date, a.wageMonth) - parseDate(b.date, b.wageMonth));

  return {
    ...existing,
    memberId: existing.memberId || newData.memberId,
    memberName: existing.memberName || newData.memberName,
    establishmentId: existing.establishmentId || newData.establishmentId,
    establishmentName: existing.establishmentName || newData.establishmentName,
    uan: existing.uan || newData.uan,
    dob: existing.dob || newData.dob,
    transactions: uniqueTxns
  };
};

import { parseEPFPassbook } from './epf-parser';
import { parseNPSPassbook } from './nps-parser';
import { PensionAccount } from './types';

export const parsePassbook = async (file: File, password?: string): Promise<any> => {
  // First, we extract the text to determine the type
  // Since both might be encrypted, we must pass the password down
  
  // Try EPF first
  try {
    const data = await parseEPFPassbook(file, password);
    // If it has transactions or an establishment name, it's likely EPF
    if (data.transactions.length > 0 || data.establishmentName) {
      return data;
    }
  } catch (error: any) {
    // If it's a password error, throw it immediately so the UI can ask for it
    if (error.name === "PasswordException") {
      throw error;
    }
    // Otherwise, maybe it's an NPS file, continue
  }

  // Try NPS
  try {
    const data = await parseNPSPassbook(file, password);
    if (data.transactions.length > 0 || data.pran) {
      return data;
    }
  } catch (error: any) {
    if (error.name === "PasswordException") {
      throw error;
    }
  }

  throw new Error("Unable to parse file. Unrecognized format.");
};

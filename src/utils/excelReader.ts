import * as XLSX from 'xlsx';
import path from 'path';

export const readAccountsFromExcel = (filePath: string): any[] => {
    try {
        const absolutePath = path.resolve(filePath);
        const workbook = XLSX.readFile(absolutePath);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        return XLSX.utils.sheet_to_json(sheet);
    } catch (error) {
        console.error("Gagal baca Excel:", error);
        return [];
    }
};
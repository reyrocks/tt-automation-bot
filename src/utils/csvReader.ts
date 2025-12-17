import fs from 'fs';
import path from 'path';

export type AccountRecord = {
  email: string;
  password: string;
};

/**
 * Read accounts from CSV with NO header.
 * Each line must be: email,password (or email;password)
 * - Supports quoted values: "email,with,comma",password
 * - Ignores empty lines
 */
export function readAccountsFromCsv(filePath: string): AccountRecord[] {
  try {
    const absolutePath = path.resolve(filePath);
    const raw = fs.readFileSync(absolutePath, 'utf8');

    const lines = raw
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const accounts: AccountRecord[] = [];
    for (const line of lines) {
      const [emailRaw, passwordRaw] = parseCsvLine(line);
      const email = (emailRaw ?? '').trim();
      const password = (passwordRaw ?? '').trim();
      if (!email || !password) continue;
      accounts.push({ email, password });
    }
    return accounts;
  } catch (error) {
    console.error('Gagal baca CSV:', error);
    return [];
  }
}

// Minimal delimited line parser (handles quotes + escaped quotes)
// Accepts common separators: comma, semicolon, tab.
function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;
  const separators = new Set([',', ';', '\t']);

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];

    if (ch === '"') {
      // escaped quote inside quoted field
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
        continue;
      }
      inQuotes = !inQuotes;
      continue;
    }

    if (!inQuotes && separators.has(ch)) {
      out.push(cur);
      cur = '';
      continue;
    }

    cur += ch;
  }
  out.push(cur);
  return out;
}



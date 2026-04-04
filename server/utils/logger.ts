import fs from 'fs';
import path from 'path';

const LOG_DIR = path.join(process.cwd(), 'logs');

if (process.env.NODE_ENV !== "production") {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR);
  }
}

const securityLogPath = path.join(LOG_DIR, 'security.log');

export const logSecurityEvent = (event: string, details: any) => {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] EVENT: ${event} | DETAILS: ${JSON.stringify(details)}\n`;
  
  console.warn(`[SECURITY EVENT] ${event}:`, details);
  
  if (process.env.NODE_ENV !== "production") {
    fs.appendFile(securityLogPath, logEntry, (err) => {
      if (err) console.error('Failed to write to security log:', err);
    });
  }
};

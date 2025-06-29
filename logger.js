import { createLogger, format, transports } from 'winston';
import path from 'path';
import fs from 'fs';

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Create a date string for the log file name
const getCurrentDate = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

// Create the logger
const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    format.errors({ stack: true }),
    format.splat(),
    format.json()
  ),
  defaultMeta: { service: 'mtg-league-bot' },
  transports: [
    // Write to all logs with level 'info' and below to `combined-DATE.log`
    new transports.File({ 
      filename: path.join(logsDir, `combined-${getCurrentDate()}.log`),
      level: 'info'
    }),
    // Write all logs with level 'error' and below to `error-DATE.log`
    new transports.File({ 
      filename: path.join(logsDir, `error-${getCurrentDate()}.log`), 
      level: 'error' 
    })
  ]
});

// If we're not in production, also log to the console
if (process.env.NODE_ENV !== 'production') {
  logger.add(new transports.Console({
    format: format.combine(
      format.colorize(),
      format.simple()
    )
  }));
}

export default logger;
import winston from 'winston';

const { combine, timestamp, printf, colorize } = winston.format;

const logFormat = printf(({ level, message, timestamp: time, ...meta }) => {
  const metaString = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  return `[${time}] ${level}: ${message}${metaString}`;
});

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: combine(timestamp(), logFormat),
  transports: [new winston.transports.Console()],
});

if (process.env.NODE_ENV !== 'production') {
  logger.configure({
    level: 'debug',
    format: combine(colorize(), timestamp(), logFormat),
  });
}

export default logger;

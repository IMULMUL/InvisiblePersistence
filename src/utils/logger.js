/**
 * Logger utility using Winston
 */

const winston = require('winston');
const path = require('path');

// Define log format
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
);

// Create logger
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    transports: [
        // Console transport
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.printf(({ level, message, timestamp, ...meta }) => {
                    let msg = `${timestamp} [${level}]: ${message}`;
                    
                    // Add metadata if present
                    if (Object.keys(meta).length > 0) {
                        msg += ` ${JSON.stringify(meta)}`;
                    }
                    
                    return msg;
                })
            )
        }),
        
        // File transport for all logs
        new winston.transports.File({
            filename: path.join('logs', 'combined.log'),
            format: logFormat
        }),
        
        // File transport for errors only
        new winston.transports.File({
            filename: path.join('logs', 'error.log'),
            level: 'error',
            format: logFormat
        }),
        
        // File transport for successful trades
        new winston.transports.File({
            filename: path.join('logs', 'trades.log'),
            level: 'info',
            format: logFormat
        })
    ]
});

// Create logs directory if it doesn't exist
const fs = require('fs');
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir);
}

module.exports = logger;


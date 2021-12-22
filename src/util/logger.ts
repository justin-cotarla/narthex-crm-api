import winston, { createLogger, format, Logger } from 'winston';

import { Config } from '../types/config';

const logPrintf = (info: winston.Logform.TransformableInfo) =>
    `[${info.timestamp}] [${info.level}]: ${info.message}`;

const getLogger = ({ file, level }: Config['log']): Logger => {
    console.log(level.toString());
    const logger = createLogger({
        level: level.toString(),
        transports: [
            new winston.transports.Console({
                format: format.combine(
                    format.colorize(),
                    format.simple(),
                    format.timestamp({
                        format: 'YYYY-MM-DD HH:mm:ss',
                    }),
                    format.errors({ stack: true }),
                    format.printf(logPrintf)
                ),
            }),
            new winston.transports.File({
                filename: file,
                format: format.combine(
                    format.simple(),
                    format.timestamp({
                        format: 'YYYY-MM-DD HH:mm:ss',
                    }),
                    format.printf(logPrintf)
                ),
            }),
        ],
    });

    return logger;
};

export { getLogger };

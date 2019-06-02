import { createLogger, transports, format, config } from 'winston'

export const logger = createLogger({
    levels: config.syslog.levels,
    transports: [
        new transports.Console({
            level: process.env.DEBUG === 'true' ? 'debug' : 'error',
        }),
    ],
    format: format.combine(format.splat(), format.simple()),
})

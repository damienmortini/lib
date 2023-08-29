/** Logger verbosity thresholds. */
export declare enum Verbosity {
    /** No events are logged. */
    SILENT = 4,
    /** Only error events are logged. */
    ERROR = 3,
    /** Only error and warn events are logged. */
    WARN = 2,
    /** Only error, warn, and info events are logged. (DEFAULT) */
    INFO = 1,
    /** All events are logged. */
    DEBUG = 0
}
export interface ILogger {
    debug(text: string): void;
    info(text: string): void;
    warn(text: string): void;
    error(text: string): void;
}
/**
 * *Logger utility class.*
 *
 * @category Utilities
 */
export declare class Logger implements ILogger {
    private readonly verbosity;
    /** Logger verbosity thresholds. */
    static Verbosity: typeof Verbosity;
    /** Default logger instance. */
    static DEFAULT_INSTANCE: Logger;
    /** Constructs a new Logger instance. */
    constructor(verbosity: number);
    /** Logs an event at level {@link Logger.Verbosity.DEBUG}. */
    debug(text: string): void;
    /** Logs an event at level {@link Logger.Verbosity.INFO}. */
    info(text: string): void;
    /** Logs an event at level {@link Logger.Verbosity.WARN}. */
    warn(text: string): void;
    /** Logs an event at level {@link Logger.Verbosity.ERROR}. */
    error(text: string): void;
}

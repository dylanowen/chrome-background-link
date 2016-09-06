namespace bl {
    export enum LogLevel {
        VERBOSE,
        LOG,
        WARN,
        ERROR,
        NONE
    }

    const emptyFunc: (...parms: any[]) => void = () => {};

    export const debug = {
        verbose: emptyFunc,
        log: emptyFunc,
        warn: emptyFunc,
        error: emptyFunc
    }

    export function setLogLevel(logLevel: LogLevel) {
        debug.verbose = emptyFunc;
        debug.log = emptyFunc;
        debug.warn = emptyFunc;
        debug.error = emptyFunc;

        switch (logLevel) {
            case LogLevel.VERBOSE:
                debug.verbose = console.log.bind(console);
            case LogLevel.LOG:
                debug.log = console.log.bind(console);
            case LogLevel.WARN:
                debug.warn = console.warn.bind(console);
            case LogLevel.ERROR:
                debug.error = console.error.bind(console);
        }
    }

    setLogLevel(LogLevel.ERROR);
}
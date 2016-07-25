namespace CBL {
    export enum LogLevel {
        LOG,
        WARN,
        ERROR,
        NONE
    }

    const emptyFunc: (...parms: any[]) => void = () => {};

    export const debug = {
        log: emptyFunc,
        warn: emptyFunc,
        error: emptyFunc
    }

    export function setLogLevel(logLevel: LogLevel) {
        debug.log = emptyFunc;
        debug.warn = emptyFunc;
        debug.error = emptyFunc;

        switch (logLevel) {
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
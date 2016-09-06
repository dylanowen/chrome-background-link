type Connection = (message: Object) => void;
type Broadcast = (response: Object) => void;

interface Application {
    connectionEvent(connection: Connection): Promise<Object>;
    messageEvent<T>(message: T): Promise<Object>;
}declare namespace bl {
    enum LogLevel {
        LOG = 0,
        WARN = 1,
        ERROR = 2,
        NONE = 3,
    }
    const debug: {
        log: (...parms: any[]) => void;
        warn: (...parms: any[]) => void;
        error: (...parms: any[]) => void;
    };
    function setLogLevel(logLevel: LogLevel): void;
}
declare namespace bl { export namespace network {
    export interface Packet {
        path: string;
        data: Object;
    }

    export interface InitialPacket extends Packet {
        data: {
            clientId: number,
            version: string
        }
    }
} }
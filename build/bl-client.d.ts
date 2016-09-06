declare namespace bl {
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
declare namespace CBL {
}
declare namespace bl {
    namespace network {
        interface Packet {
            path: string;
            data: Object;
        }
        interface InitialPacket extends Packet {
            data: {
                clientId: number;
                version: string;
            };
        }
        const INITIAL_PATH: string;
        const ERROR_PATH: string;
        function InitialPacket(clientId: number): InitialPacket;
    }
}
declare namespace bl {
    namespace network {
        class ClientNetworkHandler {
            private extensionId;
            private port;
            private clientId;
            private messageIdIncrementer;
            private readyPromise;
            version: string;
            constructor(extensionId?: string);
            ready(): Promise<void>;
            reconnect(): Promise<void>;
            disconnect(): void;
            private messageListener(rawResponse);
        }
    }
}
declare namespace bl {
    const Network: typeof network.ClientNetworkHandler;
}
type Connection = (message: Object) => void;
type Broadcast = (response: Object) => void;

interface Application {
    connectionEvent(connection: Connection): Promise<Object>;
    messageEvent<T>(message: T): Promise<Object>;
}
declare namespace bl {
    type SimpleSerializable = boolean | number | string | Object;
    type Serializable = SimpleSerializable | SimpleSerializable[];
}
declare namespace bl {
    enum LogLevel {
        VERBOSE = 0,
        LOG = 1,
        WARN = 2,
        ERROR = 3,
        NONE = 4,
    }
    const debug: {
        verbose: (...parms: any[]) => void;
        log: (...parms: any[]) => void;
        warn: (...parms: any[]) => void;
        error: (...parms: any[]) => void;
    };
    function setLogLevel(logLevel: LogLevel): void;
}
declare namespace bl {
    const LOGGING_PATH: string;
}
declare namespace bl {
    namespace network {
        interface Packet {
            path: string;
            data: Serializable;
        }
        interface InitialPacket extends Packet {
            data: {
                clientId: number;
                version: string;
            };
        }
        const INITIAL_PATH: string;
        function InitialPacket(clientId: number): InitialPacket;
    }
}
declare namespace bl {
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
        sendMessage<T>(path: string, message: Serializable): void;
        private messageListener(rawResponse);
    }
}
declare namespace bl {
    class LoggingApplication {
        private client;
        constructor(client: ClientNetworkHandler);
        log(...parms: Serializable[]): void;
    }
}
declare namespace bl {
}
declare namespace bl {
    function CreateDefaultClient(extensionId?: string): ClientNetworkHandler;
}

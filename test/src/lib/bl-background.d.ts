declare namespace bl {
    type SimpleSerializable = boolean | number | string | Object;
    type Serializable = SimpleSerializable | SimpleSerializable[];
}
declare namespace bl {
    type Connection = (message: Object) => void;
    type Broadcast = (response: Object) => void;
    interface Application {
        setBroadcast(broadcast: Broadcast): void;
        connectionEvent(): Promise<Object>;
        messageEvent(message: Serializable): Promise<Object>;
    }
}
declare namespace bl {
    class ErrorApplication implements Application {
        static PATH: string;
        setBroadcast(broadcast: Broadcast): void;
        connectionEvent(): Promise<Object>;
        messageEvent(message: Serializable): Promise<Object>;
    }
}
declare namespace bl {
    class LoggingApplication implements Application {
        setBroadcast(broadcast: Broadcast): void;
        connectionEvent(): Promise<Object>;
        messageEvent(message: Serializable): Promise<Object>;
    }
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
    class ServerNetworkHandler {
        private whitelist;
        private clientIdIncrementer;
        private connections;
        private oneOffApplications;
        private applications;
        private errorApplication;
        constructor(whitelist?: string[]);
        registerApplication(path: string, application: Application, persistentOnly?: boolean): void;
        handlePacket(rawRequest: string, fromPersistent?: boolean): Promise<network.Packet>;
        broadcast(path: string, response: Object): void;
        private externalConnectionListener(chromePort);
        private connectionListener(chromePort);
        private disconnectListener(id);
        private externalMessageListener(requestMessage, sender, sendResponse);
        private messageListener(rawRequest, sender, sendResponse);
        private validateConnection(sender);
    }
}
declare namespace bl {
    const LOGGING_PATH: string;
}
declare namespace bl {
    function CreateDefaultServer(whitelist?: string[]): ServerNetworkHandler;
}

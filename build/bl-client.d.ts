declare namespace bl {
    type SendMessage = (response: Serializable) => void;
    interface Application {
        setSendMessage(sendMessageFunc: SendMessage): void;
        messageEvent(message: Serializable): void;
    }
    abstract class ApplicationImpl implements Application {
        private sendMessageFunc;
        setSendMessage(sendMessageFunc: SendMessage): void;
        protected sendMessage(message: Serializable): void;
        messageEvent(message: Serializable): void;
    }
}
declare namespace bl {
    type SimpleSerializable = boolean | number | string | Object;
    type Serializable = SimpleSerializable | SimpleSerializable[];
    type ProxyProperty = string | number | symbol;
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
    namespace logging {
        const PATH: string;
    }
}
declare namespace bl {
    class LoggingApplication extends ApplicationImpl {
        log(...parms: Serializable[]): void;
    }
}
declare namespace bl {
    namespace proxy {
        const PATH: string;
        enum Type {
            PROXY_CREATE = 0,
            PROXY_UPDATE = 1,
            PROXY_DELETE = 2,
        }
        interface ProxyDelta {
            [key: string]: Serializable;
            [key: number]: Serializable;
        }
        interface ProxyMessage {
            type: Type;
            id: number;
        }
        type ProxyDelete = ProxyMessage;
        interface ProxyUpdate extends ProxyMessage {
            data: ProxyDelta;
        }
        interface ProxyCreate extends ProxyUpdate {
            key: string;
        }
    }
}
declare namespace bl {
    interface ProxyCreatedCallback {
        (createdProxy: Object): void;
    }
    class ProxyApplication extends ApplicationImpl {
        private proxyHandlers;
        private proxiedObjects;
        private delayedProxies;
        registerProxy(key: string | (new () => Object), clazz: (new () => Object) | ProxyCreatedCallback, callback?: ProxyCreatedCallback): void;
        private createEvent(message);
        private updateEvent(message);
        private deleteEvent(message);
        private setupProxy(message, proxyCreatedRef);
        private applyProxyDelta(proxiedInstance, delta);
        messageEvent(message: proxy.ProxyMessage): void;
    }
}
declare namespace bl {
    function ProxyStub<T extends (...args: any[]) => Promise<any>>(): T;
    interface ProxyHandler {
        (key: string | number | symbol, ...args: any[]): Promise<any>;
    }
    function injectHandler<T>(obj: T, handler: ProxyHandler): {
        proxy: T;
        revoke: () => void;
    };
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
        private messageQueue;
        private applications;
        private readyPromise;
        version: string;
        constructor(extensionId?: string);
        sendMessage<T>(path: string, message: Serializable): void;
        private postMessage(packet);
        private messageListener(rawResponse);
        registerApplication(path: string, application: Application): void;
        ready(): Promise<void>;
        reconnect(): Promise<void>;
        disconnect(): void;
    }
}
declare namespace bl {
    function CreateDefaultClient(extensionId?: string): [ClientNetworkHandler, LoggingApplication, ProxyApplication];
}

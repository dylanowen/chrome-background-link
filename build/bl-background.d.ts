declare namespace bl {
    type SimpleSerializable = boolean | number | string | Object;
    type Serializable = SimpleSerializable | SimpleSerializable[];
    type ProxyProperty = string | number | symbol;
}
declare namespace bl {
    type BroadcastFunction = (message: Serializable) => void;
    interface Application {
        connectionEvent(): Promise<Serializable[]>;
        messageEvent(message: Serializable): Promise<Serializable>;
        setBroadcast(broadcastFunc: BroadcastFunction): void;
    }
    abstract class ApplicationImpl implements Application {
        private broadcastFunc;
        connectionEvent(): Promise<Serializable[]>;
        messageEvent(message: Serializable): Promise<Serializable>;
        broadcast(message: Serializable): void;
        setBroadcast(broadcastFunc: BroadcastFunction): void;
    }
}
declare namespace bl {
    class ErrorApplication extends ApplicationImpl {
        static PATH: string;
        messageEvent(message: Serializable): Promise<Object>;
    }
}
declare namespace bl {
    class LoggingApplication extends ApplicationImpl {
        messageEvent(message: Serializable): Promise<Object>;
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
    class ProxyApplication extends ApplicationImpl {
        private proxies;
        private proxyId;
        registerProxy<T extends Object>(key: string | (new (...args: any[]) => T), clazz?: new (...args: any[]) => T): new (...args: any[]) => T;
        private constructProxy<T>(key, target, argumentsList, newTarget);
        private setProxy<T>(id, target, property, value, receiver);
        private deleteProxy<T>(id, target, property);
        /**\
        registerProxy<T>(key: string | any, obj: T): any {
            if (typeof key !== 'string' && !(key instanceof String)) {
                obj = key;
                key = obj.constructor.name;
            }

            const proxy = new Proxy<T>(obj, {
                set: (target: T, property: ProxyProperty, value: Serializable, receiver: any): boolean => {
                    const result = Reflect.set(target, property, value, receiver);



                    return result;
                },
                deleteProperty: (target: T, property: ProxyProperty): boolean => {

                }
            });

            this.proxies.set(key, obj);
        }
        */
        connectionEvent(): Promise<Serializable[]>;
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
        private persistentApplications;
        private errorApplication;
        constructor(whitelist?: string[]);
        registerApplication(path: string, application: Application, persistentOnly?: boolean): void;
        handlePacket(rawRequest: string, fromPersistent?: boolean): Promise<network.Packet>;
        broadcast(path: string, response: Serializable): void;
        private externalConnectionListener(chromePort);
        private connectionListener(chromePort);
        private disconnectListener(id);
        private externalMessageListener(requestMessage, sender, sendResponse);
        private messageListener(rawRequest, sender, sendResponse);
        private validateConnection(sender);
    }
}
declare namespace bl {
    namespace logging {
        const PATH: string;
    }
}
declare namespace bl {
    function CreateDefaultServer(whitelist?: string[]): [ServerNetworkHandler, ProxyApplication];
}

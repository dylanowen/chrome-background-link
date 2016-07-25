declare namespace CBL {
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
    interface Message {
    }
    interface InitialMessage extends Message {
        clientId: number;
        version: string;
        proxies: ProxyCreate[];
    }
    function InitialMessage(clientId: number, proxies: ProxyCreate[]): InitialMessage;
    enum RequestType {
        PROXY_INVOKE = 0,
    }
    interface RequestMessage extends Message {
        id: number;
        type: number;
    }
    enum ResponseType {
        INVALID_REQUEST = 0,
        RESPONSE = 1,
        PROXY_CREATE = 2,
        PROXY_UPDATE = 3,
        PROXY_DELETE = 4,
    }
    interface ResponseMessage extends Message {
        id?: number;
        type: ResponseType;
        data: Object;
    }
    interface ProxyDelta {
        id: number;
        obj: Object;
    }
    interface ProxyCreate extends ProxyDelta {
        type: string;
    }
    type ProxyUpdate = ProxyDelta;
    type ProxyDelete = ProxyDelta;
    interface ProxyCreateResponse extends ResponseMessage {
        data: ProxyCreate;
    }
    function ProxyCreateResponse(proxyCreate: ProxyCreate): ProxyCreateResponse;
    interface ProxyUpdateResponse extends ResponseMessage {
        data: ProxyUpdate;
    }
    function ProxyUpdateResponse(proxyUpdate: ProxyUpdate): ProxyUpdateResponse;
    interface ProxyDeleteResponse extends ResponseMessage {
        data: ProxyDelete;
    }
}
declare namespace CBL {
    class ConnectionHandler {
        protected whitelist: string[];
        private clientIdIncrementer;
        private proxyIdIncrementer;
        private connections;
        private proxies;
        constructor(whitelist?: string[]);
        handleMessage(request: CBL.RequestMessage): Promise<CBL.ResponseMessage>;
        registerProxy<T>(type: string, obj: T): T;
        getInitialProxies(): ProxyCreate[];
        private broadcast(message);
        private externalConnectionListener(chromePort);
        private connectionListener(chromePort);
        private disconnectListener(id);
        private validateConnection(sender);
    }
}
declare class MessageHandler {
}

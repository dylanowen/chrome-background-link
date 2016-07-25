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
}
declare namespace CBL {
    class ClientConnectionHandler {
        private extensionId;
        private port;
        private clientId;
        private messageIdIncrementer;
        version: string;
        constructor(extensionId: string, callback?: (success: boolean) => void);
        reconnect(): Promise<void>;
        disconnect(): void;
        private messageListener(rawResponse);
    }
}
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

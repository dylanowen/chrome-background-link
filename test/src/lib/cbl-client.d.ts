declare namespace Message {
    interface Base {
        id: number
    }

    export interface Initial {
        portId: number;
        version: string;
    }

    export enum RequestType {
        PROXY_INVOKE
    }

    export interface Request extends Base {
        type: RequestType
    }

    export enum ReponseType {
        INVALID_REQUEST,
        RESPONSE,
        PROXY_CREATE,
        PROXY_UPDATE,
        PROXY_DELETE
    }

    export interface Response extends Base {
        type: ReponseType;
        data: Object;
    }


    interface ProxyDelta {
        type: string;
        id: number;
    }
    export interface ProxyCreate extends ProxyDelta {
        obj: Object;
    }
    export type ProxyUpdate = ProxyCreate;
    export type ProxyDelete = ProxyDelta;


    export interface ProxyCreateResponse extends Response {
        data: ProxyCreate;
    }

    export interface ProxyUpdateResponse extends Response {
        data: ProxyUpdate;
    }

    export interface ProxyDeleteResponse extends Response {
        data: ProxyDelete;
    }
}declare function throwProxyStubError(...args: any[]): Promise<any>;
declare function ProxyStub<T extends (...args: any[]) => Promise<any>>(): T;
declare namespace ProxyStub {
    interface Handler {
        (key: string | number | symbol, ...args: any[]): Promise<any>;
    }
    function injectHandler<T>(obj: T, handler: Handler): {
        proxy: T;
        revoke: () => void;
    };
}
declare class ConnectionHandler {
    private extensionId;
    private port;
    private portId;
    private messageIdIncrementer;
    version: string;
    constructor(extensionId: string, callback: (success: boolean) => void);
    reconnect(): Promise<void>;
    disconnect(): void;
    private messageListener(message);
}

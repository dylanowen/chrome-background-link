/// <reference path="src/types/chrome/chrome.d.ts" />
/// <reference path="src/types/ConnectionHandler.d.ts" />
declare function throwProxyStubError(...args: any[]): Promise<any>;
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

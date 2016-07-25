namespace CBL {
    //here just for some type checking
    export interface Message {}

    export interface InitialMessage extends Message {
        clientId: number;
        version: string;
        proxies: ProxyCreate[];
    }
    export function InitialMessage(clientId: number, proxies: ProxyCreate[]): InitialMessage {
        return {
            clientId,
            version: chrome.runtime.getManifest().version,
            proxies
        };
    } 

    export enum RequestType {
        PROXY_INVOKE
    }

    export interface RequestMessage extends Message {
        id: number;
        type: number;
    }

    export enum ResponseType {
        INVALID_REQUEST,
        RESPONSE,
        PROXY_CREATE,
        PROXY_UPDATE,
        PROXY_DELETE
    }

    export interface ResponseMessage extends Message {
        id?: number;
        type: ResponseType;
        data: Object;
    }

    export interface ProxyDelta {
        id: number;
        obj: Object;
    }
    export interface ProxyCreate extends ProxyDelta {
        type: string;
    }
    export type ProxyUpdate = ProxyDelta;
    export type ProxyDelete = ProxyDelta;


    export interface ProxyCreateResponse extends ResponseMessage {
        data: ProxyCreate;
    }
    export function ProxyCreateResponse(proxyCreate: ProxyCreate): ProxyCreateResponse {
        return {
            type: ResponseType.PROXY_CREATE,
            data: proxyCreate
        };
    }

    export interface ProxyUpdateResponse extends ResponseMessage {
        data: ProxyUpdate;
    }
    export function ProxyUpdateResponse(proxyUpdate: ProxyUpdate): ProxyUpdateResponse {
        return {
            type: ResponseType.PROXY_UPDATE,
            data: proxyUpdate
        };
    }

    export interface ProxyDeleteResponse extends ResponseMessage {
        data: ProxyDelete;
    }

    const RESERVED_TYPES: number = <number>RequestType.PROXY_INVOKE;
}
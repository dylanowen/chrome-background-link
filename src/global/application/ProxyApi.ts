namespace bl { export namespace proxy {
        export const PATH: string = 'proxy';

        export enum Type {
            PROXY_CREATE,
            PROXY_UPDATE,
            PROXY_DELETE
        }

        export interface ProxyMessage {
            type: Type;
            id: number;
        }

        export type ProxyDelete = ProxyMessage;

        export interface ProxyUpdate extends ProxyMessage {
            data: Object
        }

        export interface ProxyCreate extends ProxyUpdate {
            key: string;
        }
    }
}

/*
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
*/
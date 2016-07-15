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
}
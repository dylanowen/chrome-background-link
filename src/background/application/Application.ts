/// <reference path="../../global/Global.ts"/>

declare namespace bl {
    export type PostMessage = (message: Serializable) => void;
    export type Broadcast = (response: Serializable) => void;

    export interface Application {
        setBroadcast(broadcast: Broadcast): void;
        connectionEvent(postMessage: PostMessage): void;
        messageEvent(message: Serializable): Promise<Serializable>;
    }
}
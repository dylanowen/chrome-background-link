/// <reference path="../../global/Global.ts"/>

declare namespace bl {
    export type Broadcast = (response: Serializable) => void;

    export interface Application {
        setBroadcast(broadcast: Broadcast): void;
        connectionEvent(): Promise<Serializable>;
        messageEvent(message: Serializable): Promise<Serializable>;
    }
}
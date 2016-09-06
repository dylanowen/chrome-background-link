/// <reference path="../../global/Global.ts"/>

namespace bl {
    export type Connection = (message: Object) => void;
    export type Broadcast = (response: Object) => void;

    export interface Application {
        setBroadcast(broadcast: Broadcast): void;
        connectionEvent(): Promise<Object>;
        messageEvent(message: Serializable): Promise<Object>;
    }
}
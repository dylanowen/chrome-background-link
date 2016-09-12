/// <reference path="../../global/Global.ts"/>

namespace bl {
    export type BroadcastFunction = (message: Serializable) => void;

    export interface Application {
        // lets applications build an array of messages to send to new clients connecting
        connectionEvent(): Promise<Serializable[]>;

        // lets applications respond messages
        messageEvent(message: Serializable): Promise<Serializable>;

        // set by the network handler to allow applications to broadcast messages
        setBroadcast(broadcastFunc: BroadcastFunction): void;
    }

    export abstract class ApplicationImpl implements Application {
        private broadcastFunc: BroadcastFunction = null;

        // lets applications build an array of messages to send to new clients connecting
        connectionEvent(): Promise<Serializable[]> {
            return null;
        }

        // lets applications respond messages
        messageEvent(message: Serializable): Promise<Serializable> {
            return null;
        }

        broadcast(message: Serializable): void {
            this.broadcastFunc(message);
        }

        // set by the network handler to allow applications to broadcast messages
        setBroadcast(broadcastFunc: BroadcastFunction): void {
            this.broadcastFunc = broadcastFunc;
        }
    }
}
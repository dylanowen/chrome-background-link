/// <reference path="../Global.ts"/>

namespace bl { export namespace network {

    export interface Packet {
        path: string;
        data: Serializable;
    }

    export interface InitialPacket extends Packet {
        data: {
            clientId: number,
            version: string
        }
    }

    // reserved connection paths
    export const INITIAL_PATH: string = 'initial';

    export function InitialPacket(clientId: number): InitialPacket {
        return {
            path: INITIAL_PATH,
            data: {
                clientId,
                version: chrome.runtime.getManifest().version
            }
        };
    }
} }
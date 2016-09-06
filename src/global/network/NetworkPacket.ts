namespace bl { export namespace network {

    export interface Packet {
        path: string;
        data: Object;
    }

    export interface InitialPacket extends Packet {
        data: {
            clientId: number,
            version: string
        }
    }

    // reserved connection paths
    export const INITIAL_PATH: string = 'initial';
    export const ERROR_PATH: string = 'error';

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
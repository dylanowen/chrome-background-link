declare namespace bl { export namespace network {
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
} }
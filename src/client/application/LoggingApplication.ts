/// <reference path="../../global/Global.ts"/>
/// <reference path="../../global/Debug.ts"/>

/// <reference path="../../global/application/LoggingApi.ts"/>

/// <reference path="../network/ClientNetworkHandler.ts"/>

namespace bl {

    export class LoggingApplication {
        private client: ClientNetworkHandler;

        constructor(client: ClientNetworkHandler) {
            this.client = client;
        }

        log(...parms: Serializable[]): void {
            debug.log('Sending to server: ');
            debug.log.apply(null, parms);

            this.client.sendMessage(LOGGING_PATH, parms);
        }
    }
}
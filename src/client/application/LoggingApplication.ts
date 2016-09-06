/// <reference path="../../global/Global.ts"/>
/// <reference path="../../global/Debug.ts"/>

/// <reference path="../../global/application/Api.ts"/>

/// <reference path="../network/ClientNetworkHandler.ts"/>

/// <reference path="Application.ts"/>

namespace bl {

    export class LoggingApplication implements Application {
        private client: ClientNetworkHandler;

        constructor(client: ClientNetworkHandler) {
            this.client = client;
        }

        log(...parms: Serializable[]): void {
            //debug.verbose('Sending to server: ');
            //debug.verbose.apply(null, parms);

            this.client.sendMessage(LOGGING_PATH, parms);
        }

        // Override
        messageEvent(message: Serializable): void {
            // noop
        }
    }
}
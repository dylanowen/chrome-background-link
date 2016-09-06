/// <reference path="../../global/Global.ts"/>
/// <reference path="../../global/Debug.ts"/>

/// <reference path="../../global/application/Api.ts"/>

/// <reference path="../network/ClientNetworkHandler.ts"/>

/// <reference path="Application.ts"/>

namespace bl {

    export class ProxyApplication implements Application {
        private client: ClientNetworkHandler;

        constructor(client: ClientNetworkHandler) {
            this.client = client;
        }

        // Override
        messageEvent(message: Serializable): void {
            // noop
        }
    }
}
/// <reference path="../global/Debug.ts"/>

/// <reference path="../global/network/NetworkPacket.ts"/>
/// <reference path="network/ServerNetworkHandler.ts"/>

/// <reference path="../global/application/LoggingApi.ts"/>
/// <reference path="application/ErrorApplication.ts"/>

namespace bl {
    export function CreateDefaultServer(whitelist: string[] = []): ServerNetworkHandler {
        const server = new ServerNetworkHandler(whitelist);

        server.registerApplication(LOGGING_PATH, new LoggingApplication());

        return server;
    }
}
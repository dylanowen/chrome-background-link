/// <reference path="../global/Debug.ts"/>

/// <reference path="../global/network/NetworkPacket.ts"/>
/// <reference path="network/ServerNetworkHandler.ts"/>

/// <reference path="../global/application/Api.ts"/>
/// <reference path="application/LoggingApplication.ts"/>
/// <reference path="application/ProxyApplication.ts"/>

namespace bl {
    export function CreateDefaultServer(whitelist: string[] = []): ServerNetworkHandler {
        const server = new ServerNetworkHandler(whitelist);

        server.registerApplication(LOGGING_PATH, new LoggingApplication());
        server.registerApplication(PROXY_PATH, new ProxyApplication());

        return server;
    }
}
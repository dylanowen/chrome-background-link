/// <reference path="../global/Debug.ts"/>

/// <reference path="../global/network/NetworkPacket.ts"/>
/// <reference path="network/ServerNetworkHandler.ts"/>

/// <reference path="../global/application/LoggingApi.ts"/>
/// <reference path="../global/application/ProxyApi.ts"/>
/// <reference path="application/LoggingApplication.ts"/>
/// <reference path="application/ProxyApplication.ts"/>

namespace bl {
    export function CreateDefaultServer(whitelist: string[] = []): [ServerNetworkHandler, ProxyApplication] {
        const server = new ServerNetworkHandler(whitelist);

        server.registerApplication(logging.PATH, new LoggingApplication());

        const proxyApplication = new ProxyApplication();
        server.registerApplication(proxy.PATH, proxyApplication);

        return [server, proxyApplication];
    }
}
/// <reference path="../global/Debug.ts"/>
/// <reference path="../global/ProxyStub.ts"/>

/// <reference path="network/ClientNetworkHandler.ts"/>

/// <reference path="../global/application/LoggingApi.ts"/>
/// <reference path="application/LoggingApplication.ts"/>
/// <reference path="../global/application/ProxyApi.ts"/>
/// <reference path="application/ProxyApplication.ts"/>

namespace bl {
    export function CreateDefaultClient(extensionId: string = chrome.runtime.id): [ClientNetworkHandler, LoggingApplication, ProxyApplication] {
        const client = new ClientNetworkHandler(extensionId);
        const loggingApplication = new LoggingApplication();
        const proxyApplication = new ProxyApplication();

        client.registerApplication(logging.PATH, loggingApplication);
        client.registerApplication(proxy.PATH, proxyApplication);

        return [client, loggingApplication, proxyApplication];
    }
}



//TODO https://github.com/Microsoft/TypeScript/issues/2829


/* <reference path="./ConnectionHandler.ts"/>

/
const init = (): void => {
    console.log('ready');
}

if (document.readyState == 'complete') {
    init();
}
else {
    const load = (): void => {
        document.removeEventListener('DOMContentLoaded', load);

        init();
    }

    document.addEventListener('DOMContentLoaded', load);
}
*/
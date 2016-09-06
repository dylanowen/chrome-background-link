/// <reference path="../global/Debug.ts"/>
/// <reference path="../global/ProxyStub.ts"/>
/// <reference path="../global/application/Api.ts"/>

/// <reference path="network/ClientNetworkHandler.ts"/>

/// <reference path="application/LoggingApplication.ts"/>
/// <reference path="application/ProxyApplication.ts"/>

namespace bl {
    export function CreateDefaultClient(extensionId: string = chrome.runtime.id): [ClientNetworkHandler, LoggingApplication, ProxyApplication] {
        const client = new ClientNetworkHandler(extensionId);
        const logging = new LoggingApplication(client);
        const proxy = new ProxyApplication(client);

        client.registerApplication(LOGGING_PATH, logging);
        client.registerApplication(PROXY_PATH, proxy);

        return [client, logging, proxy];
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
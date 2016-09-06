/// <reference path="../global/Debug.ts"/>
/// <reference path="../global/ProxyStub.ts"/>

/// <reference path="network/ClientNetworkHandler.ts"/>


namespace bl {
    export function CreateDefaultClient(extensionId: string = chrome.runtime.id): ClientNetworkHandler {
        const client = new ClientNetworkHandler(extensionId);

        return client;
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
/// <reference path="../lib/cbl-background.d.ts"/>

CBL.setLogLevel(CBL.LogLevel.LOG);
let connectionHandler: CBL.ConnectionHandler;

const init = (): void => {
    connectionHandler = new CBL.ConnectionHandler();

    const testObject = {
        test: 'ello'
    }

    const testProxy = connectionHandler.registerProxy('test', testObject);

    setTimeout(() => {
        console.log('hello');
        testProxy.test = 'hi there';
    }, 5000);


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
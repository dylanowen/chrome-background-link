/// <reference path="../lib/bl-background.d.ts"/>

/// <reference path="../types/TestObject.d.ts"/>

bl.setLogLevel(bl.LogLevel.LOG);
const [network, proxyApplication] = bl.CreateDefaultServer();

class Test {
    value: string;
}

const TestProxy: new() => Test = proxyApplication.registerProxy(Test);

const test = new TestProxy();

let id = 5;
setInterval(() => {
    id++;
    test.value = id + ' new value';
}, 1000);

/*
CBL.setLogLevel(CBL.LogLevel.LOG);
let connectionHandler: CBL.ConnectionHandler;

class LinkedObject implements TestObject {
    test: string

    constructor() {
        this.test = 'hello';
    }

    setTest(test: string): void {
        this.test = test;

        console.log(this.test); 
    }
}

const init = (): void => {
    connectionHandler = new CBL.ConnectionHandler();

    const testObject = new LinkedObject();

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
*/
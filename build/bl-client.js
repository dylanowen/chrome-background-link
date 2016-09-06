var bl;
(function (bl) {
    (function (LogLevel) {
        LogLevel[LogLevel["LOG"] = 0] = "LOG";
        LogLevel[LogLevel["WARN"] = 1] = "WARN";
        LogLevel[LogLevel["ERROR"] = 2] = "ERROR";
        LogLevel[LogLevel["NONE"] = 3] = "NONE";
    })(bl.LogLevel || (bl.LogLevel = {}));
    var LogLevel = bl.LogLevel;
    const emptyFunc = () => { };
    bl.debug = {
        log: emptyFunc,
        warn: emptyFunc,
        error: emptyFunc
    };
    function setLogLevel(logLevel) {
        bl.debug.log = emptyFunc;
        bl.debug.warn = emptyFunc;
        bl.debug.error = emptyFunc;
        switch (logLevel) {
            case LogLevel.LOG:
                bl.debug.log = console.log.bind(console);
            case LogLevel.WARN:
                bl.debug.warn = console.warn.bind(console);
            case LogLevel.ERROR:
                bl.debug.error = console.error.bind(console);
        }
    }
    bl.setLogLevel = setLogLevel;
    setLogLevel(LogLevel.ERROR);
})(bl || (bl = {}));
var CBL;
(function (CBL) {
    function throwProxyStubError(...args) {
        throw new Error("Did not forward function call correctly");
    }
    function ProxyStub() {
        return throwProxyStubError;
    }
    var ProxyStub;
    (function (ProxyStub) {
        function injectHandler(obj, handler) {
            handler = handler.bind(null, obj);
            return Proxy.revocable(obj, {
                get: (target, key) => {
                    const value = Reflect.get(target, key);
                    if (value === throwProxyStubError) {
                        return handler.bind(null, key);
                    }
                    return value;
                }
            });
        }
        ProxyStub.injectHandler = injectHandler;
    })(ProxyStub || (ProxyStub = {}));
})(CBL || (CBL = {}));
var bl;
(function (bl) {
    var network;
    (function (network) {
        network.INITIAL_PATH = 'initial';
        network.ERROR_PATH = 'error';
        function InitialPacket(clientId) {
            return {
                path: network.INITIAL_PATH,
                data: {
                    clientId,
                    version: chrome.runtime.getManifest().version
                }
            };
        }
        network.InitialPacket = InitialPacket;
    })(network = bl.network || (bl.network = {}));
})(bl || (bl = {}));
var bl;
(function (bl) {
    var network;
    (function (network) {
        class ClientNetworkHandler {
            constructor(extensionId = chrome.runtime.id) {
                this.port = null;
                this.messageIdIncrementer = 1;
                this.extensionId = extensionId;
            }
            reconnect() {
                this.disconnect();
                return new Promise((resolve, reject) => {
                    let receivedStatus = false;
                    setTimeout(() => {
                        if (!receivedStatus) {
                            const errorMessage = 'Catastrophic Conection Error: could not reach the background process';
                            reject(errorMessage);
                            bl.debug.error(errorMessage);
                        }
                    }, 1000);
                    this.port = chrome.runtime.connect(this.extensionId);
                    const initialListener = (message) => {
                        this.port.onMessage.removeListener(initialListener);
                        receivedStatus = true;
                        try {
                            const { clientId, version } = JSON.parse(message).data;
                            this.clientId = clientId;
                            this.version = version;
                            this.port.onMessage.addListener(this.messageListener.bind(this));
                            bl.debug.log('Opened a connection\n Version ' + this.version + '\n Client Id: ' + this.clientId);
                            resolve();
                        }
                        catch (e) {
                            const errorMessage = e.message;
                            reject(errorMessage);
                            bl.debug.error(errorMessage);
                        }
                    };
                    this.port.onMessage.addListener(initialListener);
                });
            }
            disconnect() {
                if (this.port !== null) {
                    this.port.disconnect();
                }
                this.port = null;
                this.clientId = -1;
            }
            messageListener(rawResponse) {
                try {
                    let response = JSON.parse(rawResponse);
                    console.log(response);
                }
                catch (e) {
                    bl.debug.error('Failed to parse the message: ' + rawResponse, e);
                }
            }
        }
        network.ClientNetworkHandler = ClientNetworkHandler;
    })(network = bl.network || (bl.network = {}));
})(bl || (bl = {}));
var bl;
(function (bl) {
    bl.Network = bl.network.ClientNetworkHandler;
})(bl || (bl = {}));

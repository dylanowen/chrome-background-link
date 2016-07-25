var CBL;
(function (CBL) {
    function InitialMessage(clientId, proxies) {
        return {
            clientId,
            version: chrome.runtime.getManifest().version,
            proxies
        };
    }
    CBL.InitialMessage = InitialMessage;
    (function (RequestType) {
        RequestType[RequestType["PROXY_INVOKE"] = 0] = "PROXY_INVOKE";
    })(CBL.RequestType || (CBL.RequestType = {}));
    var RequestType = CBL.RequestType;
    (function (ResponseType) {
        ResponseType[ResponseType["INVALID_REQUEST"] = 0] = "INVALID_REQUEST";
        ResponseType[ResponseType["RESPONSE"] = 1] = "RESPONSE";
        ResponseType[ResponseType["PROXY_CREATE"] = 2] = "PROXY_CREATE";
        ResponseType[ResponseType["PROXY_UPDATE"] = 3] = "PROXY_UPDATE";
        ResponseType[ResponseType["PROXY_DELETE"] = 4] = "PROXY_DELETE";
    })(CBL.ResponseType || (CBL.ResponseType = {}));
    var ResponseType = CBL.ResponseType;
    function ProxyCreateResponse(proxyCreate) {
        return {
            type: ResponseType.PROXY_CREATE,
            data: proxyCreate
        };
    }
    CBL.ProxyCreateResponse = ProxyCreateResponse;
    function ProxyUpdateResponse(proxyUpdate) {
        return {
            type: ResponseType.PROXY_UPDATE,
            data: proxyUpdate
        };
    }
    CBL.ProxyUpdateResponse = ProxyUpdateResponse;
    const RESERVED_TYPES = RequestType.PROXY_INVOKE;
})(CBL || (CBL = {}));
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
var CBL;
(function (CBL) {
    class ClientConnectionHandler {
        constructor(extensionId, callback = () => { }) {
            this.port = null;
            this.messageIdIncrementer = 1;
            this.extensionId = extensionId;
            this.reconnect().then(callback.bind(null, true)).catch(callback.bind(null, false));
        }
        reconnect() {
            this.disconnect();
            return new Promise((resolve, reject) => {
                let receivedStatus = false;
                setTimeout(() => {
                    if (!receivedStatus) {
                        const errorMessage = 'Catastrophic Conection Error: could not reach the background process';
                        reject(errorMessage);
                        CBL.debug.error(errorMessage);
                    }
                }, 1000);
                this.port = chrome.runtime.connect(this.extensionId);
                const initialListener = (message) => {
                    this.port.onMessage.removeListener(initialListener);
                    receivedStatus = true;
                    try {
                        const { clientId, version, proxies } = JSON.parse(message);
                        this.clientId = clientId;
                        this.version = version;
                        console.log(proxies);
                        this.port.onMessage.addListener(this.messageListener.bind(this));
                        CBL.debug.log('Opened a connection\n Version ' + this.version + '\n Client Id: ' + this.clientId);
                        resolve();
                    }
                    catch (e) {
                        const errorMessage = e.message;
                        reject(errorMessage);
                        CBL.debug.error(errorMessage);
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
                CBL.debug.error('Failed to parse the message: ' + rawResponse, e);
            }
        }
    }
    CBL.ClientConnectionHandler = ClientConnectionHandler;
})(CBL || (CBL = {}));
var CBL;
(function (CBL) {
    (function (LogLevel) {
        LogLevel[LogLevel["LOG"] = 0] = "LOG";
        LogLevel[LogLevel["WARN"] = 1] = "WARN";
        LogLevel[LogLevel["ERROR"] = 2] = "ERROR";
        LogLevel[LogLevel["NONE"] = 3] = "NONE";
    })(CBL.LogLevel || (CBL.LogLevel = {}));
    var LogLevel = CBL.LogLevel;
    const emptyFunc = () => { };
    CBL.debug = {
        log: emptyFunc,
        warn: emptyFunc,
        error: emptyFunc
    };
    function setLogLevel(logLevel) {
        CBL.debug.log = emptyFunc;
        CBL.debug.warn = emptyFunc;
        CBL.debug.error = emptyFunc;
        switch (logLevel) {
            case LogLevel.LOG:
                CBL.debug.log = console.log.bind(console);
            case LogLevel.WARN:
                CBL.debug.warn = console.warn.bind(console);
            case LogLevel.ERROR:
                CBL.debug.error = console.error.bind(console);
        }
    }
    CBL.setLogLevel = setLogLevel;
    setLogLevel(LogLevel.ERROR);
})(CBL || (CBL = {}));

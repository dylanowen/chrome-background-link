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
    class MessageHandler {
        constructor(connectionHandler) {
            this.connectionHandler = connectionHandler;
        }
        messageHandler(rawRequest) {
            let request;
            try {
                request = JSON.parse(rawRequest);
            }
            catch (e) {
                return Promise.reject('Failed to parse the request: ' + rawRequest);
            }
            return this.connectionHandler.handleMessage(request);
        }
    }
    class PersistentConnection extends MessageHandler {
        constructor(chromePort, clientId, connectionHandler) {
            super(connectionHandler);
            this.open = false;
            this.chromePort = chromePort;
            this.clientId = clientId;
            this.open = true;
            this.postMessage(CBL.InitialMessage(this.clientId, this.connectionHandler.getInitialProxies()));
            CBL.debug.log('Client ' + this.clientId + ' connected');
            this.chromePort.onMessage.addListener(this.messageListener.bind(this));
        }
        disconnect() {
            this.open = false;
            CBL.debug.log('Client ' + this.clientId + ' disconnected');
        }
        messageListener(rawRequest) {
            this.messageHandler(rawRequest)
                .then(this.postMessage.bind(this))
                .catch(this.postError.bind(this));
        }
        postMessage(message) {
            if (this.open) {
                this.chromePort.postMessage(JSON.stringify(message));
            }
            else {
                CBL.debug.warn('Couldn\'t send the message, port closed.', message);
            }
        }
        postError(reason) {
        }
    }
    class ConnectionHandler {
        constructor(whitelist = []) {
            this.clientIdIncrementer = 1;
            this.proxyIdIncrementer = 1;
            this.connections = new Map();
            this.proxies = new Map();
            this.whitelist = whitelist;
            chrome.runtime.onConnect.addListener(this.connectionListener.bind(this));
            chrome.runtime.onConnectExternal.addListener(this.externalConnectionListener.bind(this));
        }
        handleMessage(request) {
            if (CBL.RequestType.PROXY_INVOKE === request.type) {
            }
            else {
                return Promise.reject('Invalid message');
            }
        }
        registerProxy(type, obj) {
            const id = this.proxyIdIncrementer++;
            const proxy = new Proxy(obj, {
                set: (target, key, value, receiver) => {
                    const delta = {};
                    delta[key] = value;
                    this.broadcast(CBL.ProxyUpdateResponse({
                        id,
                        obj: delta
                    }));
                    return Reflect.set(target, key, value, receiver);
                }
            });
            this.proxies.set(id, { type, proxy, obj });
            this.broadcast(CBL.ProxyCreateResponse({ id, type, obj }));
            return proxy;
        }
        getInitialProxies() {
            const proxyCreates = [];
            for (const [id, proxyReference] of this.proxies) {
                proxyCreates.push({
                    id,
                    type: proxyReference.type,
                    obj: proxyReference.obj
                });
            }
            return proxyCreates;
        }
        broadcast(message) {
            for (const connection of this.connections.values()) {
                connection.postMessage(message);
            }
        }
        externalConnectionListener(chromePort) {
            this.validateConnection(chromePort.sender);
            return this.connectionListener(chromePort);
        }
        connectionListener(chromePort) {
            const id = this.clientIdIncrementer++;
            const connection = new PersistentConnection(chromePort, id, this);
            this.connections.set(id, connection);
            chromePort.onDisconnect.addListener(this.disconnectListener.bind(this, id));
        }
        disconnectListener(id) {
            this.connections.get(id).disconnect();
            this.connections.delete(id);
        }
        validateConnection(sender) {
            if (this.whitelist != null && !(sender.id in this.whitelist)) {
                throw new Error('Extension with id not in the whitelist attempted to connect: ' + sender.id);
            }
        }
    }
    CBL.ConnectionHandler = ConnectionHandler;
})(CBL || (CBL = {}));
class MessageHandler {
}

var bl;
(function (bl) {
    (function (LogLevel) {
        LogLevel[LogLevel["VERBOSE"] = 0] = "VERBOSE";
        LogLevel[LogLevel["LOG"] = 1] = "LOG";
        LogLevel[LogLevel["WARN"] = 2] = "WARN";
        LogLevel[LogLevel["ERROR"] = 3] = "ERROR";
        LogLevel[LogLevel["NONE"] = 4] = "NONE";
    })(bl.LogLevel || (bl.LogLevel = {}));
    var LogLevel = bl.LogLevel;
    const emptyFunc = () => { };
    bl.debug = {
        verbose: emptyFunc,
        log: emptyFunc,
        warn: emptyFunc,
        error: emptyFunc
    };
    function setLogLevel(logLevel) {
        bl.debug.verbose = emptyFunc;
        bl.debug.log = emptyFunc;
        bl.debug.warn = emptyFunc;
        bl.debug.error = emptyFunc;
        switch (logLevel) {
            case LogLevel.VERBOSE:
                bl.debug.verbose = console.log.bind(console);
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
var bl;
(function (bl) {
    var network;
    (function (network) {
        network.INITIAL_PATH = 'initial';
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
    class ApplicationImpl {
        constructor() {
            this.broadcastFunc = null;
        }
        connectionEvent() {
            return null;
        }
        messageEvent(message) {
            return null;
        }
        broadcast(message) {
            this.broadcastFunc(message);
        }
        setBroadcast(broadcastFunc) {
            this.broadcastFunc = broadcastFunc;
        }
    }
    bl.ApplicationImpl = ApplicationImpl;
})(bl || (bl = {}));
var bl;
(function (bl) {
    class ErrorApplication extends bl.ApplicationImpl {
        messageEvent(message) {
            bl.debug.error(message);
            return Promise.resolve(message);
        }
    }
    ErrorApplication.PATH = 'error';
    bl.ErrorApplication = ErrorApplication;
})(bl || (bl = {}));
var bl;
(function (bl) {
    class PersistentConnection {
        constructor(chromePort, clientId, networkHandler) {
            this.open = false;
            this.chromePort = chromePort;
            this.clientId = clientId;
            this.networkHandler = networkHandler;
            this.open = true;
            this.postPacket(bl.network.InitialPacket(this.clientId));
            bl.debug.log('Client ' + this.clientId + ' connected');
            this.chromePort.onMessage.addListener(this.handlePacket.bind(this));
        }
        handlePacket(rawRequest) {
            bl.debug.verbose("Receieved Persistent Message: ", rawRequest, this.clientId);
            const response = this.networkHandler.handlePacket(rawRequest);
            if (response !== null) {
                response.then((packet) => {
                    this.postPacket(packet);
                }).catch((e) => {
                    bl.debug.error('Missed internal error: ' + e);
                    throw new Error(e);
                });
            }
        }
        postPacket(packet) {
            if (this.open) {
                this.chromePort.postMessage(JSON.stringify(packet));
            }
        }
        disconnect() {
            this.open = false;
            bl.debug.log('Client ' + this.clientId + ' disconnected');
        }
    }
    class ServerNetworkHandler {
        constructor(whitelist = []) {
            this.clientIdIncrementer = 1;
            this.connections = new Map();
            this.oneOffApplications = new Map();
            this.persistentApplications = new Map();
            this.errorApplication = new bl.ErrorApplication();
            this.whitelist = whitelist;
            this.registerApplication(bl.ErrorApplication.PATH, this.errorApplication);
            chrome.runtime.onConnect.addListener(this.connectionListener.bind(this));
            chrome.runtime.onConnectExternal.addListener(this.externalConnectionListener.bind(this));
            chrome.runtime.onMessage.addListener(this.messageListener);
            chrome.runtime.onMessageExternal.addListener(this.externalMessageListener);
        }
        registerApplication(path, application, persistentOnly = false) {
            if (!persistentOnly) {
                this.oneOffApplications.set(path, application);
            }
            this.persistentApplications.set(path, application);
            application.setBroadcast(this.broadcast.bind(this, path));
        }
        handlePacket(rawRequest, fromPersistent = true) {
            let request;
            try {
                request = JSON.parse(rawRequest);
            }
            catch (e) {
                request = createErrorPacket('Failed to parse the request: ' + rawRequest);
            }
            const path = request.path;
            let application = null;
            if (!fromPersistent) {
                if (this.oneOffApplications.has(path)) {
                    application = this.oneOffApplications.get(path);
                }
            }
            else if (this.persistentApplications.has(path)) {
                application = this.persistentApplications.get(path);
            }
            if (application == null) {
                request = createErrorPacket('Failed to find the application at: ' + path);
                application = this.errorApplication;
            }
            try {
                const response = application.messageEvent(request.data);
                if (response !== null) {
                    return response.then(createPacket.bind(null, path))
                        .catch(createErrorPacket);
                }
                return null;
            }
            catch (e) {
                bl.debug.error('Internal error: ' + e);
                Promise.resolve(createErrorPacket('Internal error: ' + e));
            }
        }
        broadcast(path, response) {
            const packet = createPacket(path, response);
            for (const connection of this.connections.values()) {
                connection.postPacket(packet);
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
            for (const [path, application] of this.persistentApplications) {
                const connectionSetup = application.connectionEvent();
                if (connectionSetup !== null) {
                    const postPacket = connection.postPacket.bind(connection);
                    connectionSetup.then((messages) => {
                        return messages.map(createPacket.bind(null, path));
                    })
                        .catch((error) => {
                        return [createErrorPacket(error)];
                    })
                        .then((packets) => {
                        packets.forEach(postPacket);
                    });
                }
            }
        }
        disconnectListener(id) {
            this.connections.get(id).disconnect();
            this.connections.delete(id);
        }
        externalMessageListener(requestMessage, sender, sendResponse) {
            this.validateConnection(sender);
            return this.messageListener(requestMessage, sender, sendResponse);
        }
        messageListener(rawRequest, sender, sendResponse) {
            bl.debug.verbose("Receieved One Off Message: ", rawRequest);
            const response = this.handlePacket(rawRequest, false);
            if (response !== null) {
                response.then((packet) => {
                    sendResponse(JSON.stringify(packet));
                }, (e) => {
                    bl.debug.error('Missed internal error: ' + e);
                    throw new Error(e);
                });
                return true;
            }
            else {
                return false;
            }
        }
        validateConnection(sender) {
            if (this.whitelist != null && !(sender.id in this.whitelist)) {
                throw new Error('Extension with id not in the whitelist attempted to connect: ' + sender.id);
            }
        }
    }
    bl.ServerNetworkHandler = ServerNetworkHandler;
    function createPacket(path, message) {
        return {
            path: path,
            data: message
        };
    }
    function createErrorPacket(message) {
        return createPacket(bl.ErrorApplication.PATH, message);
    }
})(bl || (bl = {}));
var bl;
(function (bl) {
    var logging;
    (function (logging) {
        logging.PATH = 'log';
    })(logging = bl.logging || (bl.logging = {}));
})(bl || (bl = {}));
var bl;
(function (bl) {
    var proxy;
    (function (proxy) {
        proxy.PATH = 'proxy';
        (function (Type) {
            Type[Type["PROXY_CREATE"] = 0] = "PROXY_CREATE";
            Type[Type["PROXY_UPDATE"] = 1] = "PROXY_UPDATE";
            Type[Type["PROXY_DELETE"] = 2] = "PROXY_DELETE";
        })(proxy.Type || (proxy.Type = {}));
        var Type = proxy.Type;
    })(proxy = bl.proxy || (bl.proxy = {}));
})(bl || (bl = {}));
var bl;
(function (bl) {
    class LoggingApplication extends bl.ApplicationImpl {
        messageEvent(message) {
            if (message instanceof Array) {
                bl.debug.log.apply(null, message);
            }
            else {
                bl.debug.log(message);
            }
            return null;
        }
    }
    bl.LoggingApplication = LoggingApplication;
})(bl || (bl = {}));
var bl;
(function (bl) {
    class ProxyApplication extends bl.ApplicationImpl {
        constructor(...args) {
            super(...args);
            this.proxies = new Map();
            this.proxyId = 1;
        }
        registerProxy(key, clazz) {
            if (typeof key !== 'string' && !(key instanceof String)) {
                clazz = key;
                key = clazz.name;
            }
            const proxy = new Proxy(clazz, {
                construct: this.constructProxy.bind(this, key)
            });
            return proxy;
        }
        constructProxy(key, target, argumentsList, newTarget) {
            const realInstance = Reflect.construct(target, argumentsList, newTarget);
            const id = this.proxyId++;
            this.proxies.set(id, {
                key: key,
                obj: realInstance
            });
            this.broadcast({
                type: bl.proxy.Type.PROXY_CREATE,
                key: key,
                id: id,
                data: realInstance
            });
            const proxyInstance = new Proxy(realInstance, {
                set: this.setProxy.bind(this, id),
                deleteProperty: this.deleteProxy.bind(this, id)
            });
            return proxyInstance;
        }
        setProxy(id, target, property, value, receiver) {
            const delta = {};
            delta[property] = value;
            const updateMessage = {
                type: bl.proxy.Type.PROXY_UPDATE,
                id: id,
                data: delta
            };
            this.broadcast(updateMessage);
            return Reflect.set(target, property, value, receiver);
        }
        deleteProxy(id, target, property) {
            this.broadcast({
                type: bl.proxy.Type.PROXY_DELETE,
                id: id
            });
            this.proxies.delete(id);
            return Reflect.deleteProperty(target, property);
        }
        connectionEvent() {
            const proxyCreates = [];
            for (let [id, proxyRef] of this.proxies.entries()) {
                proxyCreates.push({
                    type: bl.proxy.Type.PROXY_CREATE,
                    key: proxyRef.key,
                    id: id,
                    data: proxyRef.obj
                });
            }
            return Promise.resolve(proxyCreates);
        }
        messageEvent(message) {
            return null;
        }
    }
    bl.ProxyApplication = ProxyApplication;
})(bl || (bl = {}));
var bl;
(function (bl) {
    function CreateDefaultServer(whitelist = []) {
        const server = new bl.ServerNetworkHandler(whitelist);
        server.registerApplication(bl.logging.PATH, new bl.LoggingApplication());
        const proxyApplication = new bl.ProxyApplication();
        server.registerApplication(bl.proxy.PATH, proxyApplication);
        return [server, proxyApplication];
    }
    bl.CreateDefaultServer = CreateDefaultServer;
})(bl || (bl = {}));

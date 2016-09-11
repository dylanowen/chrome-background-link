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
    class ErrorApplication {
        setBroadcast(broadcast) {
        }
        connectionEvent() {
            return null;
        }
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
            this.applications = new Map();
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
            this.applications.set(path, application);
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
            if (!fromPersistent && this.oneOffApplications.has(path)) {
                application = this.oneOffApplications.get(path);
            }
            else if (this.applications.has(path)) {
                application = this.applications.get(path);
            }
            else {
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
            for (const [path, application] of this.applications) {
                const connectionSetup = application.connectionEvent();
                if (connectionSetup !== null) {
                    connectionSetup.then(createPacket.bind(null, path))
                        .catch(createErrorPacket)
                        .then(connection.postPacket);
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
            const response = this.handlePacket(rawRequest);
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
    bl.LOGGING_PATH = 'log';
    bl.PROXY_PATH = 'proxy';
})(bl || (bl = {}));
var bl;
(function (bl) {
    class LoggingApplication {
        setBroadcast(broadcast) {
        }
        connectionEvent() {
            return null;
        }
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
    class ProxyApplication {
        constructor() {
            this.broadcast = null;
            this.proxies = new Map();
        }
        registerProxy(key, obj) {
        }
        setBroadcast(broadcast) {
            this.broadcast = broadcast;
        }
        connectionEvent() {
            return null;
        }
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
    bl.ProxyApplication = ProxyApplication;
})(bl || (bl = {}));
var bl;
(function (bl) {
    function CreateDefaultServer(whitelist = []) {
        const server = new bl.ServerNetworkHandler(whitelist);
        server.registerApplication(bl.LOGGING_PATH, new bl.LoggingApplication());
        server.registerApplication(bl.PROXY_PATH, new bl.ProxyApplication());
        return server;
    }
    bl.CreateDefaultServer = CreateDefaultServer;
})(bl || (bl = {}));

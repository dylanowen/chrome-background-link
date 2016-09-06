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
        class PersistentConnection {
            constructor(chromePort, clientId, networkHandler) {
                this.open = false;
                this.chromePort = chromePort;
                this.clientId = clientId;
                this.networkHandler = networkHandler;
                this.open = true;
                this.postPacket(network.InitialPacket(this.clientId));
                bl.debug.log('Client ' + this.clientId + ' connected');
                this.chromePort.onMessage.addListener(this.handlePacket.bind(this));
            }
            handlePacket(rawRequest) {
                const response = this.networkHandler.handlePacket(rawRequest);
                response.then((packet) => {
                    this.postPacket(packet);
                }).catch((e) => {
                    bl.debug.error('Missed internal error: ' + e);
                    throw new Error(e);
                });
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
                this.whitelist = whitelist;
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
                return this.broadcast.bind(this, path);
            }
            handlePacket(rawRequest, fromPersistent = true) {
                let request;
                try {
                    request = JSON.parse(rawRequest);
                }
                catch (e) {
                    return Promise.reject('Failed to parse the request: ' + rawRequest);
                }
                const path = request.path;
                let application = null;
                if (!fromPersistent && this.oneOffApplications.has(path)) {
                    application = this.oneOffApplications.get(path);
                }
                else {
                    application = this.applications.get(path);
                }
                if (application == null) {
                    return Promise.reject('Failed to find the application at: ' + path);
                }
                try {
                    return application.messageEvent(request.data).then((result) => {
                        return {
                            path: path,
                            data: result
                        };
                    }).catch((error) => {
                        return {
                            path: network.ERROR_PATH,
                            data: error
                        };
                    });
                }
                catch (e) {
                    bl.debug.error('Internal error: ' + e);
                    return Promise.reject('Internal error: ' + e);
                }
            }
            broadcast(path, response) {
                const packet = {
                    path: path,
                    data: response
                };
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
                response.then((packet) => {
                    sendResponse(JSON.stringify(packet));
                }, (e) => {
                    bl.debug.error('Missed internal error: ' + e);
                    throw new Error(e);
                });
                return true;
            }
            validateConnection(sender) {
                if (this.whitelist != null && !(sender.id in this.whitelist)) {
                    throw new Error('Extension with id not in the whitelist attempted to connect: ' + sender.id);
                }
            }
        }
        network.ServerNetworkHandler = ServerNetworkHandler;
    })(network = bl.network || (bl.network = {}));
})(bl || (bl = {}));
var bl;
(function (bl) {
    bl.Network = bl.network.ServerNetworkHandler;
})(bl || (bl = {}));

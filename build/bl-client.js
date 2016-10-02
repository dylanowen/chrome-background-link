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
    function throwProxyStubError(...args) {
        throw new Error("Did not forward function call correctly");
    }
    function ProxyStub() {
        return throwProxyStubError;
    }
    bl.ProxyStub = ProxyStub;
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
    bl.injectHandler = injectHandler;
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
    class ClientNetworkHandler {
        constructor(extensionId = chrome.runtime.id) {
            this.port = null;
            this.messageQueue = [];
            this.applications = new Map();
            this.readyPromise = null;
            this.extensionId = extensionId;
            const cleanup = () => {
                this.readyPromise = null;
            };
            this.readyPromise = this.reconnect().then(cleanup, (reason) => {
                cleanup();
                throw reason;
            });
        }
        sendMessage(path, message) {
            const packet = {
                path: path,
                data: message
            };
            if (this.port != null) {
                this.postMessage(packet);
            }
            else {
                this.messageQueue.push(packet);
            }
        }
        postMessage(packet) {
            bl.debug.verbose('Sending Packet: ', packet);
            this.port.postMessage(JSON.stringify(packet));
        }
        messageListener(rawResponse) {
            try {
                let packet = JSON.parse(rawResponse);
                bl.debug.verbose('Receiving Packet: ', packet);
                const path = packet.path;
                if (this.applications.has(path)) {
                    const application = this.applications.get(path);
                    application.messageEvent(packet.data);
                }
            }
            catch (e) {
                bl.debug.error('Failed to parse the message: ' + rawResponse, e);
            }
        }
        registerApplication(path, application) {
            application.setSendMessage(this.sendMessage.bind(this, path));
            this.applications.set(path, application);
        }
        ready() {
            if (this.clientId !== -1) {
                return Promise.resolve();
            }
            else if (this.readyPromise !== null) {
                return this.readyPromise;
            }
            else {
                return Promise.reject('No connection has been established');
            }
        }
        reconnect() {
            this.disconnect();
            return new Promise((resolve, reject) => {
                let receivedStatus = false;
                setTimeout(() => {
                    if (!receivedStatus) {
                        const errorMessage = 'Catastrophic Conection Error: could not reach the background process at "' + this.extensionId + '"';
                        reject(errorMessage);
                        bl.debug.error(errorMessage);
                    }
                }, 1000);
                const initialListener = (message) => {
                    this.port.onMessage.removeListener(initialListener);
                    receivedStatus = true;
                    try {
                        const { clientId, version } = JSON.parse(message).data;
                        this.clientId = clientId;
                        this.version = version;
                        this.port.onMessage.addListener(this.messageListener.bind(this));
                        bl.debug.log('Opened a connection\n Version ' + this.version + '\n Client Id: ' + this.clientId);
                        for (let packet of this.messageQueue) {
                            this.postMessage(packet);
                        }
                        resolve();
                    }
                    catch (e) {
                        const errorMessage = e.message;
                        reject(errorMessage);
                        bl.debug.error(errorMessage);
                    }
                };
                this.port = chrome.runtime.connect(this.extensionId);
                this.port.onMessage.addListener(initialListener);
            });
        }
        disconnect() {
            if (this.port !== null) {
                this.port.disconnect();
            }
            this.port = null;
            this.clientId = -1;
            this.readyPromise = null;
            this.messageQueue = [];
        }
    }
    bl.ClientNetworkHandler = ClientNetworkHandler;
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
    class ApplicationImpl {
        setSendMessage(sendMessageFunc) {
            this.sendMessageFunc = sendMessageFunc;
        }
        sendMessage(message) {
            if (this.sendMessageFunc === null) {
                throw new Error('Attempting to use an unregistered Application');
            }
            this.sendMessageFunc(message);
        }
        messageEvent(message) {
        }
    }
    bl.ApplicationImpl = ApplicationImpl;
})(bl || (bl = {}));
var bl;
(function (bl) {
    class LoggingApplication extends bl.ApplicationImpl {
        log(...parms) {
            this.sendMessage(parms);
        }
    }
    bl.LoggingApplication = LoggingApplication;
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
    class ProxyApplication extends bl.ApplicationImpl {
        constructor(...args) {
            super(...args);
            this.proxyHandlers = new Map();
            this.proxiedObjects = new Map();
            this.delayedProxies = new Map();
        }
        registerProxy(key, clazz, callback) {
            if (typeof key !== 'string' && !(key instanceof String)) {
                callback = clazz;
                clazz = key;
                key = clazz.name;
            }
            const proxyCreatedRef = {
                clazz: clazz,
                callback: callback
            };
            this.proxyHandlers.set(key, proxyCreatedRef);
            for (let delayedProxy of this.delayedProxies.values()) {
                const createMessage = delayedProxy[0];
                if (createMessage.key === key) {
                    const instance = this.setupProxy(createMessage, proxyCreatedRef);
                    for (let i = 0; i < delayedProxy.length; i++) {
                        const updateMessage = delayedProxy[i];
                        this.applyProxyDelta(instance, updateMessage.data);
                    }
                }
            }
        }
        createEvent(message) {
            bl.debug.verbose('Creating Proxy', message);
            const key = message.key;
            if (this.proxyHandlers.has(key)) {
                this.setupProxy(message, this.proxyHandlers.get(key));
            }
            else {
                this.delayedProxies.set(message.id, [message]);
            }
        }
        updateEvent(message) {
            bl.debug.verbose('Updating Proxy', message);
            const id = message.id;
            if (this.proxiedObjects.has(id)) {
                this.applyProxyDelta(this.proxiedObjects.get(id), message.data);
            }
            else if (this.delayedProxies.has(id)) {
                const delayedProxy = this.delayedProxies.get(id);
                delayedProxy.push(message);
            }
            else {
                throw new Error('Couldn\'t find instance to update: ' + id);
            }
        }
        deleteEvent(message) {
            bl.debug.verbose('Deleting Proxy', message);
            const id = message.id;
            if (this.proxiedObjects.has(id)) {
                this.proxiedObjects.delete(id);
            }
            else if (this.delayedProxies.has(id)) {
                this.delayedProxies.delete(id);
            }
            else {
                throw new Error('Couldn\'t find instance to delete: ' + id);
            }
        }
        setupProxy(message, proxyCreatedRef) {
            const instance = new proxyCreatedRef.clazz();
            this.proxiedObjects.set(message.id, instance);
            this.applyProxyDelta(instance, message.data);
            proxyCreatedRef.callback(instance);
            return instance;
        }
        applyProxyDelta(proxiedInstance, delta) {
            for (let key in delta) {
                Reflect.set(proxiedInstance, key, delta[key]);
            }
        }
        messageEvent(message) {
            switch (message.type) {
                case bl.proxy.Type.PROXY_CREATE:
                    this.createEvent(message);
                    break;
                case bl.proxy.Type.PROXY_UPDATE:
                    this.updateEvent(message);
                    break;
                case bl.proxy.Type.PROXY_DELETE:
                    this.deleteEvent(message);
                    break;
                default:
                    throw new Error('Unexpected proxy message type: ' + message.type);
            }
        }
    }
    bl.ProxyApplication = ProxyApplication;
})(bl || (bl = {}));
var bl;
(function (bl) {
    function CreateDefaultClient(extensionId = chrome.runtime.id) {
        const client = new bl.ClientNetworkHandler(extensionId);
        const loggingApplication = new bl.LoggingApplication();
        const proxyApplication = new bl.ProxyApplication();
        client.registerApplication(bl.logging.PATH, loggingApplication);
        client.registerApplication(bl.proxy.PATH, proxyApplication);
        return [client, loggingApplication, proxyApplication];
    }
    bl.CreateDefaultClient = CreateDefaultClient;
})(bl || (bl = {}));

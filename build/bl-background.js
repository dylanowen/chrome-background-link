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
        class PersistentConnection {
            constructor(chromePort, clientId, networkHandler) {
                this.open = false;
                this.chromePort = chromePort;
                this.clientId = clientId;
                this.networkHandler = networkHandler;
                this.open = true;
                this.postPacket(InitialPacket(this.clientId));
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
        }
        network.ServerNetworkHandler = ServerNetworkHandler;
    })(network = bl.network || (bl.network = {}));
})(bl || (bl = {}));
const WTF = "wtf";

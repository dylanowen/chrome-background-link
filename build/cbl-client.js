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
class ConnectionHandler {
    constructor(extensionId, callback) {
        this.port = null;
        this.messageIdIncrementer = 1;
        this.extensionId = extensionId;
        this.reconnect().then(() => callback(true)).catch(() => callback(false));
    }
    reconnect() {
        this.disconnect();
        return new Promise((resolve, reject) => {
            let receivedStatus = false;
            setTimeout(() => {
                if (!receivedStatus) {
                    const errorMessage = 'Catastrophic Conection Error: could not reach the background process';
                    reject(errorMessage);
                    console.error(errorMessage);
                }
            }, 1000);
            this.port = chrome.runtime.connect(this.extensionId);
            const initialListener = (message) => {
                this.port.onMessage.removeListener(initialListener);
                receivedStatus = true;
                try {
                    const { portId, version } = JSON.parse(message);
                    this.portId = portId;
                    this.version = version;
                    this.port.onMessage.addListener(this.messageListener);
                    console.log('Versions ' + this.version + '\n Opened a connection on port ' + this.port);
                    resolve();
                }
                catch (e) {
                    const errorMessage = e.message;
                    reject(errorMessage);
                    console.error(errorMessage);
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
        this.portId = -1;
    }
    messageListener(message) {
        console.log(this);
    }
}

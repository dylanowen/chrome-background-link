/// <reference path="../external_types/chrome/chrome.d.ts"/>
//    <reference path="../external_types/chrome/chrome-app.d.ts"/>

/// <reference path="../global/Debug.ts"/>
/// <reference path="../global/Message.ts"/>

namespace CBL {
    type Callback = (message: string) => void;

    abstract class MessageHandler {
        protected connectionHandler: ConnectionHandler;

        constructor(connectionHandler: ConnectionHandler) {
            this.connectionHandler = connectionHandler;
        }

        messageHandler(rawRequest: string): Promise<CBL.ResponseMessage> {
            let request: RequestMessage;

            try {
                request = JSON.parse(rawRequest);
            }
            catch (e) {
                return <Promise<any>>Promise.reject('Failed to parse the request: ' + rawRequest);
            }

            return this.connectionHandler.handleMessage(request);
        }
    }

    class PersistentConnection extends MessageHandler {
        private chromePort: chrome.runtime.Port;
        private clientId: number;
        private open: boolean = false;

        constructor(chromePort: chrome.runtime.Port, clientId: number, connectionHandler: ConnectionHandler) {
            super(connectionHandler);

            this.chromePort = chromePort;
            this.clientId = clientId;

            this.open = true;

            //let the client know the connection was successful
            this.postMessage(InitialMessage(this.clientId, this.connectionHandler.getInitialProxies()));
            debug.log('Client ' + this.clientId + ' connected');

            //start listening for messages
            this.chromePort.onMessage.addListener(this.messageListener.bind(this));
            this.chromePort.onDisconnect.addListener(this.disconnectListener.bind(this));

            //send the proxy objects we're tracking
        }

        disconnectListener(): void {
            this.open = false;

            debug.log('Client ' + this.clientId + ' disconnected');
        }

        messageListener(rawRequest: string): void {
            this.messageHandler(rawRequest)
                .then(this.postMessage.bind(this))
                .catch(this.postError.bind(this));
        }

        postMessage(message: Message): void {
            if (this.open) {
                //chrome can't be trusted to stringify the message itself so we have to do it here https://code.google.com/p/chromium/issues/detail?id=402745
                this.chromePort.postMessage(JSON.stringify(message));
            }
            else {
                debug.warn('Couldn\'t send the message, port closed.', message);
            }
        }

        postError(reason: string): void {

        }
    }

    /*
    class OneOffHandler extends MessageHandler {
        constructor(connectionHandler: ConnectionHandler) {
            super(connectionHandler);
        }

        messageListener(requestMessage: string, callback: Callback): void {
            
        }
    }
    */

    interface ProxyReference {
        type: string;
        proxy: Object;
        obj: Object;
    }

    export class ConnectionHandler {
        protected whitelist: string[];
        //private oneOffHandler: OneOffHandler;
        private clientIdIncrementer: number = 1;
        private proxyIdIncrementer: number = 1;

        private connections: Map<number, PersistentConnection> = new Map();
        private proxies: Map<number, ProxyReference> = new Map();

        //default to only the current extension
        constructor(whitelist: string[] = []) {
            this.whitelist = whitelist;

            //this.oneOffHandler = new OneOffHandler(this);

            chrome.runtime.onConnect.addListener(this.connectionListener.bind(this));
            chrome.runtime.onConnectExternal.addListener(this.externalConnectionListener.bind(this));

            /*
            chrome.runtime.onMessage.addListener(this.messageListener);
            chrome.runtime.onMessageExternal.addListener(this.externalMessageListener);
            */
        }

        handleMessage(request: CBL.RequestMessage): Promise<CBL.ResponseMessage> {
            if (CBL.RequestType.PROXY_INVOKE === request.type) {
                //proxy handler
            }
            else {
                return <Promise<any>>Promise.reject('Invalid message');
            }
        }

        registerProxy<T>(type: string, obj: T): T {
            const id = this.proxyIdIncrementer++;

            const proxy = new Proxy(obj, {
                set: (target: T, key: PropertyKey, value: any, receiver: any): boolean => {
                    const delta: any = {}
                    delta[key] = value;

                    this.broadcast(ProxyUpdateResponse({
                        id,
                        obj: delta
                    }));

                    return Reflect.set(target, key, value, receiver);
                }
            });

            this.proxies.set(id, {type, proxy, obj});

            this.broadcast(ProxyCreateResponse({ id, type, obj }));

            return proxy;
        }

        getInitialProxies(): ProxyCreate[] {
            const proxyCreates: ProxyCreate[] = [];

            for (const [id, proxyReference] of this.proxies) {
                proxyCreates.push({
                    id,
                    type: proxyReference.type,
                    obj: proxyReference.obj
                });
            }

            return proxyCreates;
        }

        private broadcast(message: ResponseMessage): void {
            for (const connection of this.connections.values()) {
                connection.postMessage(message);
            }
        }

        private externalConnectionListener(chromePort: chrome.runtime.Port): void {
            this.validateConnection(chromePort.sender);

            return this.connectionListener(chromePort);
        }

        private connectionListener(chromePort: chrome.runtime.Port): void {
            const id = this.clientIdIncrementer++;

            const connection = new PersistentConnection(chromePort, id, this);

            this.connections.set(id, connection);

            chromePort.onDisconnect.addListener(this.disconnectListener.bind(this, id));
        }

        private disconnectListener(id: number): void {
            this.connections.delete(id);
        }

        /*
        private externalMessageListener(requestMessage: string, sender: chrome.runtime.MessageSender, sendResponse: (response: any) => void): boolean {
            this.validateConnection(sender);

            return this.messageListener(requestMessage, sender, sendResponse);
        }

        private messageListener(requestMessage: string, sender: chrome.runtime.MessageSender, sendResponse: (response: any) => void): boolean {
            this.oneOffHandler.messageListener(requestMessage, sendResponse);

            return true;
        }*/

        private validateConnection(sender: chrome.runtime.MessageSender): void {
            //if the whitelist is null let everything through
            if (this.whitelist != null && !(sender.id in this.whitelist)) {
                throw new Error('Extension with id not in the whitelist attempted to connect: ' + sender.id);
            }
        }
    }
}

//class ConnectionHandler {
    
//}
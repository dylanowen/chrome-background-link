/// <reference path="../../external_types/chrome/chrome.d.ts"/>

/// <reference path="../../global/Debug.ts"/>

/// <reference path="../../global/network/NetworkPacket.ts"/>

namespace bl { export namespace network {

    class PersistentConnection {
        private networkHandler: ServerNetworkHandler;
        private chromePort: chrome.runtime.Port;
        private clientId: number;
        private open: boolean = false;

        constructor(chromePort: chrome.runtime.Port, clientId: number, networkHandler: ServerNetworkHandler) {
            this.chromePort = chromePort;
            this.clientId = clientId;
            this.networkHandler = networkHandler;

            this.open = true;

            //let the client know the connection was successful
            this.postPacket(InitialPacket(this.clientId));
            debug.log('Client ' + this.clientId + ' connected');

            //start listening for messages
            this.chromePort.onMessage.addListener(this.handlePacket.bind(this));
        }

         handlePacket(rawRequest: string): void {
             const response: Promise<Packet> = this.networkHandler.handlePacket(rawRequest);

             response.then((packet: Packet) => {
                 this.postPacket(packet);
             }).catch((e: any) => {
                 debug.error('Missed internal error: ' + e);

                 throw new Error(e);
             })
         }

         postPacket(packet: Packet): void {
             if (this.open) {
                 this.chromePort.postMessage(JSON.stringify(packet));    
             }
         }

         disconnect(): void {
            this.open = false;

            debug.log('Client ' + this.clientId + ' disconnected');
        }
    }

    /*
    This is mildly modeled after the OSI Model. 
    */
    export class ServerNetworkHandler {
        private whitelist: string[];
        private clientIdIncrementer: number = 1;

        private connections: Map<number, PersistentConnection> = new Map();
        private oneOffApplications: Map<string, Application> = new Map();
        private applications: Map<string, Application> = new Map();

        //default to only the current extension
        constructor(whitelist: string[] = []) {
            this.whitelist = whitelist;

            //this.oneOffHandler = new OneOffHandler(this);

            chrome.runtime.onConnect.addListener(this.connectionListener.bind(this));
            chrome.runtime.onConnectExternal.addListener(this.externalConnectionListener.bind(this));

            chrome.runtime.onMessage.addListener(this.messageListener);
            chrome.runtime.onMessageExternal.addListener(this.externalMessageListener);
        }

        registerApplication(path: string, application: Application, persistentOnly: boolean = false): Broadcast {
            if (!persistentOnly) {
                this.oneOffApplications.set(path, application);
            }

            this.applications.set(path, application);

            return this.broadcast.bind(this, path);
        }

        handlePacket(rawRequest: string, fromPersistent: boolean = true): Promise<Packet> {
            let request: Packet;

            try {
                request = JSON.parse(rawRequest);
            }
            catch (e) {
                return <Promise<any>>Promise.reject('Failed to parse the request: ' + rawRequest);
            }

            const path: string = request.path;
            let application: Application = null;
            if (!fromPersistent && this.oneOffApplications.has(path)) {
                application = this.oneOffApplications.get(path);
            }
            else {
                application = this.applications.get(path);
            }

            // make sure we found an application
            if (application == null) {
                return <Promise<any>>Promise.reject('Failed to find the application at: ' + path);
            }

            try {
                return application.messageEvent(request.data).then((result: Object): Packet => {
                    return {
                        path: path,
                        data: result
                    };
                }).catch((error: string): Packet => {
                    return {
                        path: ERROR_PATH,
                        data: error
                    };
                });
            }
            catch (e) {
                debug.error('Internal error: ' + e);

                return <Promise<any>>Promise.reject('Internal error: ' + e);
            }
        }

        broadcast(path: string, response: Object): void {
            const packet = {
                path: path,
                data: response
            };

            for (const connection of this.connections.values()) {
                connection.postPacket(packet);
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
            this.connections.get(id).disconnect();

            this.connections.delete(id);
        }

        private externalMessageListener(requestMessage: string, sender: chrome.runtime.MessageSender, sendResponse: (response: any) => void): boolean {
            this.validateConnection(sender);

            return this.messageListener(requestMessage, sender, sendResponse);
        }

        private messageListener(rawRequest: string, sender: chrome.runtime.MessageSender, sendResponse: (response: any) => void): boolean {
            const response: Promise<Packet> = this.handlePacket(rawRequest);

             response.then((packet: Packet) => {
                 sendResponse(JSON.stringify(packet));
             }, (e: any) => {
                 debug.error('Missed internal error: ' + e);

                 throw new Error(e);
             })

            return true;
        }

        private validateConnection(sender: chrome.runtime.MessageSender): void {
            //if the whitelist is null let everything through
            if (this.whitelist != null && !(sender.id in this.whitelist)) {
                throw new Error('Extension with id not in the whitelist attempted to connect: ' + sender.id);
            }
        }
    }
} }

    /*
    private function parseMessage(rawRequest: string): Promise<ResponseMessage> {

    }


    interface MessageHandler {
        messageListener(rawRequest: string): Promise<ResponseMessage>;

        

        //registerMessageHandler(type: number): void;
    }

    

    class PersistentConnection extends MessageParser {
        private messageHandler: MessageHandler;
        private chromePort: chrome.runtime.Port;
        private clientId: number;
        private open: boolean = false;

        constructor(chromePort: chrome.runtime.Port, clientId: number, messageHandler: MessageHandler) {
            super();

            this.chromePort = chromePort;
            this.clientId = clientId;
            this.messageHandler = messageHandler;

            this.open = true;

            //let the client know the connection was successful
            //this.postMessage(InitialMessage(this.clientId, this.connectionHandler.getInitialProxies()));
            debug.log('Client ' + this.clientId + ' connected');

            //start listening for messages
            this.chromePort.onMessage.addListener(this.messageListener.bind(this));
            //send the proxy objects we're tracking
        }

        

        messageListener(rawRequest: string): void {
            this.parseMessage(rawRequest)
                .then(this.postMessage.bind(this))
                .catch(this.postError.bind(this));
        }

        postMessage(message: ResponseMessage): void {
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
    
}


/*
namespace bl {
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

    

    /*
    class OneOffHandler extends MessageHandler {
        constructor(connectionHandler: ConnectionHandler) {
            super(connectionHandler);
        }

        messageListener(requestMessage: string, callback: Callback): void {
            
        }
    }
    * /

    interface ProxyReference {
        type: string;
        proxy: Object;
        obj: Object;
    }

    export class PersistentConnectionHandler {
        
        //private oneOffHandler: OneOffHandler;
        

        private connections: Map<number, PersistentConnection> = new Map();

        //default to only the current extension
        constructor(whitelist: string[] = []) {
            this.whitelist = whitelist;

            //this.oneOffHandler = new OneOffHandler(this);

            chrome.runtime.onConnect.addListener(this.connectionListener.bind(this));
            chrome.runtime.onConnectExternal.addListener(this.externalConnectionListener.bind(this));

            /*
            chrome.runtime.onMessage.addListener(this.messageListener);
            chrome.runtime.onMessageExternal.addListener(this.externalMessageListener);
            * /
        }

        handleMessage(request: CBL.RequestMessage): Promise<CBL.ResponseMessage> {
            if (CBL.RequestType.PROXY_INVOKE === request.type) {
                //proxy handler
            }
            else {
                return <Promise<any>>Promise.reject('Invalid message');
            }
        }

        /*
        registerProxy<T>(type: string, obj: T): T {
            const id = this.proxyIdIncrementer++;

            const proxy = new Proxy(obj, {
                set: (target: T, key: PropertyKey, value: any, receiver: any): boolean => {
                    // maybe filter by type here?
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
        * /

        private broadcast(message: ResponseMessage): void {
            for (const connection of this.connections.values()) {
                connection.postMessage(message);
            }
        }

        
    }
}
*/
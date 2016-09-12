/// <reference path="../../external_types/chrome/chrome.d.ts"/>

/// <reference path="../../global/Global.ts"/>
/// <reference path="../../global/Debug.ts"/>

/// <reference path="../application/Application.ts"/>
/// <reference path="../application/ErrorApplication.ts"/>

/// <reference path="../../global/network/NetworkPacket.ts"/>

namespace bl {

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
            this.postPacket(network.InitialPacket(this.clientId));
            debug.log('Client ' + this.clientId + ' connected');

            //start listening for messages
            this.chromePort.onMessage.addListener(this.handlePacket.bind(this));
        }

        handlePacket(rawRequest: string): void {
            debug.verbose("Receieved Persistent Message: ", rawRequest, this.clientId);

            const response: Promise<network.Packet> = this.networkHandler.handlePacket(rawRequest);

            // check if we have something to respond with
            if (response !== null) {
                response.then((packet: network.Packet) => {
                    this.postPacket(packet);
                }).catch((e: any) => {
                    debug.error('Missed internal error: ' + e);

                    throw new Error(e);
                })
            }
        }

        postPacket(packet: network.Packet): void {
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
        // applications that support messages vs long running connections
        private oneOffApplications: Map<string, Application> = new Map();
        // applications that run on persistent connections
        private persistentApplications: Map<string, Application> = new Map();
        private errorApplication: Application = new ErrorApplication();

        //default to only the current extension
        constructor(whitelist: string[] = []) {
            this.whitelist = whitelist;

            // register our application for handling errors
            this.registerApplication(ErrorApplication.PATH, this.errorApplication);

            chrome.runtime.onConnect.addListener(this.connectionListener.bind(this));
            chrome.runtime.onConnectExternal.addListener(this.externalConnectionListener.bind(this));

            chrome.runtime.onMessage.addListener(this.messageListener);
            chrome.runtime.onMessageExternal.addListener(this.externalMessageListener);
        }

        registerApplication(path: string, application: Application, persistentOnly: boolean = false): void {
            if (!persistentOnly) {
                this.oneOffApplications.set(path, application);   
            }

            // if something isn't persistentOnly it still supports persistent connections
            this.persistentApplications.set(path, application);

            application.setBroadcast(this.broadcast.bind(this, path));
        }

        handlePacket(rawRequest: string, fromPersistent: boolean = true): Promise<network.Packet> {
            let request: network.Packet;

            try {
                request = JSON.parse(rawRequest);
            }
            catch (e) {
                request = createErrorPacket('Failed to parse the request: ' + rawRequest);
            }

            const path: string = request.path;
            let application: Application = null;
            if (!fromPersistent) {
                if (this.oneOffApplications.has(path)) {
                    application = this.oneOffApplications.get(path);
                }
            }
            else if (this.persistentApplications.has(path)) {
                application = this.persistentApplications.get(path);
            }

            // check if we found an application
            if (application == null) {
                // if we can't find an application use our ErrorApplication
                request = createErrorPacket('Failed to find the application at: ' + path);
                application = this.errorApplication;
            }

            try {
                const response: Promise<Serializable> = application.messageEvent(request.data);

                if (response !== null) {
                    return response.then(createPacket.bind(null, path))
                        .catch(createErrorPacket);
                }

                return null;
            }
            catch (e) {
                debug.error('Internal error: ' + e);

                Promise.resolve(createErrorPacket('Internal error: ' + e));
            }
        }

        broadcast(path: string, response: Serializable): void {
            const packet = createPacket(path, response);

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

            for (const [path, application] of this.persistentApplications) {
                // let our application know about the open connectsions
                const connectionSetup: Promise<Serializable[]> = application.connectionEvent();

                //check if we have anything to send
                if (connectionSetup !== null) {
                    const postPacket = connection.postPacket.bind(connection);

                    connectionSetup.then((messages: Serializable[]) => {
                            return messages.map(createPacket.bind(null, path));
                        })
                        .catch((error) => {
                            return [createErrorPacket(error)];
                        })
                        .then((packets: network.Packet[]) => {
                            packets.forEach(postPacket);
                        });
                }
            }
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
            debug.verbose("Receieved One Off Message: ", rawRequest);

            const response: Promise<network.Packet> = this.handlePacket(rawRequest, false);

            // check if we need to hold the connection open
            if (response !== null) {
                response.then((packet: network.Packet) => {
                    sendResponse(JSON.stringify(packet));
                }, (e: any) => {
                    debug.error('Missed internal error: ' + e);

                    throw new Error(e);
                })

                return true;
            }
            else {
                return false;
            }
        }

        private validateConnection(sender: chrome.runtime.MessageSender): void {
            //if the whitelist is null let everything through
            if (this.whitelist != null && !(sender.id in this.whitelist)) {
                throw new Error('Extension with id not in the whitelist attempted to connect: ' + sender.id);
            }
        }
    }

    function createPacket(path: string, message: Serializable): network.Packet {
        return {
            path: path,
            data: message
        };
    }

    function createErrorPacket(message: Serializable): network.Packet {
        return createPacket(ErrorApplication.PATH, message);
    }
}

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
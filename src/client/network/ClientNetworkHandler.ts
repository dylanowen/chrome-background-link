/// <reference path="../../external_types/chrome/chrome.d.ts"/>

/// <reference path="../../global/Global.ts"/>
/// <reference path="../../global/Debug.ts"/>

/// <reference path="../../global/network/NetworkPacket.ts"/>


namespace bl {
    export class ClientNetworkHandler {
        private extensionId: string;
        private port: chrome.runtime.Port = null;
        private clientId: number;
        private messageQueue: network.Packet[] = [];

        private applications: Map<string, Application> = new Map();
        
        private readyPromise: Promise<void> = null;

        version: string;

        constructor(extensionId: string = chrome.runtime.id) {
            this.extensionId = extensionId;
            
            const cleanup = (): void => {
                this.readyPromise = null;
            }
            this.readyPromise = this.reconnect().then(cleanup, (reason) => {
                cleanup();

                throw reason;
            });
        }

        sendMessage<T>(path: string, message: Serializable): void {
            const packet: network.Packet = {
                path: path,
                data: message
            }

            if (this.port != null) {
                this.postMessage(packet);
            }
            else {
                this.messageQueue.push(packet);
            }
        }

        private postMessage(packet: network.Packet): void {
            debug.verbose('Sending Packet: ', packet);

            this.port.postMessage(JSON.stringify(packet));
        }

        private messageListener(rawResponse: string): void {
            try {
                let packet: network.Packet = JSON.parse(rawResponse);

                debug.verbose('Receiving Packet: ', packet);

                const path: string = packet.path;
                if (this.applications.has(path)) {
                    const application: Application = this.applications.get(path);

                    application.messageEvent(packet.data);
                }
            }
            catch (e) {
                debug.error('Failed to parse the message: ' + rawResponse, e);
            }
        }

        registerApplication(path: string, application: Application): void {
            application.setSendMessage(this.sendMessage.bind(this, path));

            this.applications.set(path, application);
        }

        ready(): Promise<void> {
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

        reconnect(): Promise<void> {
            this.disconnect();

            return new Promise<void>((resolve, reject) => {
                //verify that we can reach the background process
                let receivedStatus = false;
                setTimeout(() => {
                    if (!receivedStatus) {
                        const errorMessage = 'Catastrophic Conection Error: could not reach the background process at "' + this.extensionId + '"';

                        reject(errorMessage);
                        debug.error(errorMessage);
                    }
                }, 1000);

                const initialListener = (message: string): void => {
                    //clear out the listener
                    this.port.onMessage.removeListener(initialListener);

                    //let the script know the background connection is working
                    receivedStatus = true;

                    try {
                        const {clientId, version} = (<network.InitialPacket>JSON.parse(message)).data;
                        this.clientId = clientId;
                        this.version = version;

                        // bind the main message listener
                        this.port.onMessage.addListener(this.messageListener.bind(this));

                        debug.log('Opened a connection\n Version ' + this.version + '\n Client Id: ' + this.clientId);

                        // send our queued up messages
                        for (let packet of this.messageQueue) {
                            this.postMessage(packet);
                        }

                        resolve();
                    }
                    catch (e) {
                        const errorMessage = e.message;

                        reject(errorMessage);
                        debug.error(errorMessage);
                    }
                }

                this.port = chrome.runtime.connect(this.extensionId);

                this.port.onMessage.addListener(initialListener);
            });
        }

        disconnect(): void {
            if (this.port !== null) {
                this.port.disconnect();
            }

            this.port = null;
            this.clientId = -1;
            this.readyPromise = null;
            this.messageQueue = [];
        }
    }
}

/*
###*
@const
###
class ConnectionHandler
    @SUV_MANAGER_ID: 'hklcdfgpgcldenjehnbkjmfhjhkhgjop'
    _port: null
    _portId: -1
    _messageIdIncrementer: 1
    _messageQueue: null
    _messageHandlers: null
    _messageCallbacks: null

    suvmanagerVersion: null

    constructor: (callback, suvmanagerId) ->
        if suvmanagerId?
            ConnectionHandler.SUV_MANAGER_ID = suvmanagerId
        else if 'SUV_MANAGER_ID' of localStorage
            #check for a suv manager id override in local stoarge
            ConnectionHandler.SUV_MANAGER_ID = localStorage.SUV_MANAGER_ID

        @_messageHandlers = {}

        @reconnect(callback)

        return

    #use this to drop all pending messages like if we change our login or something
    reconnect: (callback = () -> ) =>
        @disconnect()

        #verify that we can reach the background process
        receivedStatus = false
        setTimeout(() =>
            if not receivedStatus
                callback(false)
                console.error('Catastrophic Conection Error: could not reach the background process')
            return
        , 1000)

        @_port = chrome.runtime.connect(ConnectionHandler.SUV_MANAGER_ID)

        initialListener = (message) =>
            #clear out this listener
            @_port.onMessage.removeListener(initialListener)

            #let the script know the background connection is working
            receivedStatus = true

            {portId: @_portId, version: @suvmanagerVersion} = JSON.parse(message)

            #bind the main message listener
            @_port.onMessage.addListener(@_messageListener)

            console.log('SUV Manager Version ' + @suvmanagerVersion + '\n Opened Connection on port ' + @_portId)

            #send all the queued messages
            for obj in @_messageQueue
                @sendMessage(obj.message, obj.callback)
            @_messageQueue = []

            callback(true)

            return

        #console.time('Bootup Time')
        @_port.onMessage.addListener(initialListener)

        return

    disconnect: () ->
        #drop all pending messages
        if _port?
            @_port.disconnect()
        @_messageQueue = []
        @_messageCallbacks = {}
        @_port = null
        @_portId = -1

        return

    registerMessageHandler: (key, value) ->
        #console.error 'Registered Message Handler: ' + key
        if key of @_messageHandlers
            #don't register the same function multiple times
            if @_messageHandlers[key].indexOf(value) is -1
                @_messageHandlers[key].push(value)
        else
            @_messageHandlers[key] = [value]

        return

    ###
        if value is null it deregisters everything for the key
        otherwise it searches for the value and removes that
    ###
    deRegisterMessageHandler: (key, value) ->
        if key of @_messageHandlers
            if value?
                index = @_messageHandlers[key].indexOf(value)
                if index isnt -1
                    @_messageHandlers[key].splice(index, 1)
            else
                delete @_messageHandlers[key]

        return

    _messageListener: (message) =>
        message = JSON.parse(message)

        #console.log 'Received Message: ', message

        #TODO remove this once we've validated all the responses
        if message.data.status is suvmanager.RESPONSE_STATUS.BAD and message.globalId?
            console.error('Bad Message Format', message)
        
        if message.data.status isnt suvmanager.RESPONSE_STATUS.BAD and 'globalId' of message and message.globalId of @_messageHandlers
            for messageHandler in @_messageHandlers[message.globalId]
                messageHandler(message.data)
        
        if 'id' of message
            if message.id of @_messageCallbacks
                #console.timeEnd('Message Time ' + message.id)

                #console.log 'MessageCallback', message.id, message.data

                @_messageCallbacks[message.id](message.data)

                delete @_messageCallbacks[message.id]
            else if message.id is suvmanager.Request.BAD_REQUEST_ID
                console.log(message.data.error)
            
        return

    ###
        Sends a message over the opened port
    ###
    sendMessage: (message, callback) ->
        if @_port?
            if message.id?
                throw 'You can\'t set the message id'

            if callback?
                #add the message id
                message.id = @_messageIdIncrementer++

                #register the callback
                if typeof callback isnt 'function'
                    throw 'Your callback function has to be a function'

                @_messageCallbacks[message.id] = callback

                #only log messages that we'll get a response for
                #console.time('Message Time ' + message.id)

            #console.log 'Sending Message', message, callback

            @_port.postMessage(JSON.stringify(message))
        else
            @_messageQueue.push(message: message, callback: callback)

        return

    ###
        Sends a message without opening a port, this is better for quick one time messages and should never be used if a port is open
    ###
    @sendMessage: (message, callback) ->
        #set an id so we get a response back
        message.id = suvmanager.Request.SIMPLE_MESSAGE_ID

        chrome.runtime.sendMessage(ConnectionHandler.SUV_MANAGER_ID, JSON.stringify(message), (response) ->
            if response?
                callback(JSON.parse(response).data)
            else
                callback({status: suvmanager.RESPONSE_STATUS.BAD, error: chrome.runtime.lastError.message})

            return
        )

        return

###*
@const
###
_suvmanager['ConnectionHandler'] = ConnectionHandler
*/
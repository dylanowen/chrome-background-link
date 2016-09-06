/// <reference path="../external_types/chrome/chrome.d.ts"/>

/// <reference path="../lib/bl-client.d.ts"/>

bl.setLogLevel(bl.LogLevel.VERBOSE);
const network = bl.CreateDefaultClient();
const logger = new bl.LoggingApplication(network);

function documentReady(): Promise<void> {
    return new Promise<void>((resolve: () => void) => {
        if (document.readyState == 'complete') {
            resolve();
        }
        else {
            const load = (): void => {
                document.removeEventListener('DOMContentLoaded', load);

                resolve();
            }

            document.addEventListener('DOMContentLoaded', load);
        }
    });
}

Promise.all<void>([network.ready(), documentReady()])
    .then(() => {
        logger.log('ready', {
            objec: 'more',
            complicated: new Date()
        });
    })
    .catch((error) => {
        console.error('Error initializing: ', error)
    });



/*
class Test {
    test: string;

    printTest = ProxyStub<() => Promise<string>>();
    setTest = ProxyStub<(name: string) => Promise<string>>();
    setTestSpecial = ProxyStub<(name: string, description: string) => Promise<string>>();

    //printTest(): Promise<string> {
    //    throw 
    // }
}

class WorkerApi {
    setName = ProxyStub<(name: string) => Promise<string>>();
}

type ObjectKey = string | number | symbol;

const worker = new WorkerApi();

//console.log(test);

const {proxy} = ProxyStub.injectHandler(worker, (key: ObjectKey, ...args: any[]) => {
    return new Promise<any>((resolve, reject) => {
        window.setTimeout(() => {
            resolve(args.join(' '));
        }, 1000);
    });
});


//proxy.test = 'alksdjflsadfjklsd';
//proxy.test;
console.log(proxy.setName('dylan').then((result) => console.log(result)));
//console.log(proxy.printTest().then((result) => console.log(result)));
//console.log(proxy.setTestSpecial("name", 'description').then((result) => console.log(result)));

/*
//add a proxy to propagate method calls 
const {proxy, revoke} = Proxy.revocable(test, {
    get: (target: any, key: ObjectKey) => {
        if (target[key] === Function) {
            return (...args: any[]): Promise<any> => {
                return new Promise<any>((resolve, reject) => {
                    window.setTimeout(
                        function() {
                            //console.log(Reflect.get(target, key));
                            // We fulfill the promise !
                            resolve('result');
                        }, Math.random() * 2000 + 1000);
                }); //should be a promise
            };
        }
        else {
            return Reflect.get(target, key);
        }
    }
});


*/

/*
console.log('test')

interface BackendResponse<T> {
    
    error?: string
}

//TODO better name
type EmptyPromise = Promise<void>;

interface Suv {
    id: string;
    setDescription<T>(description: string): EmptyPromise
}

class ClientSuv implements Suv {

    id: string;

    constructor(id: string) {
        this.id = id;
    }

    setDescription(description: string): EmptyPromise {
        return null;
    }
}

namespace Message {
    interface Base {
        id: number
    }

    export enum RequestType {
        PROXY_INVOKE
    }

    
    export interface Request extends Base {
        type: RequestType
    }

    export enum ReponseType {
        INVALID_REQUEST,
        RESPONSE,
        PROXY_CREATE,
        PROXY_UPDATE,
        PROXY_DELETE
    };

    export interface Response extends Base {
        type: ReponseType;
        data: Object;
    };


    interface ProxyDelta {
        type: string;
        id: number;
    }
    export interface ProxyCreate extends ProxyDelta {
        obj: Object;
    }
    export type ProxyUpdate = ProxyCreate;
    export type ProxyDelete = ProxyDelta;


    export interface ProxyCreateResponse extends Response {
        data: ProxyCreate;
    }

    export interface ProxyUpdateResponse extends Response {
        data: ProxyUpdate;
    }

    export interface ProxyDeleteResponse extends Response {
        data: ProxyDelete;
    }
}

interface TypeListener {
    <T>(obj: T): void;
}

//console.log(typeof ClientSuv);

type ObjectKey = string | number | symbol;

class ConnectionHandler {

    private extensionId: string;
    private typeMapping: Map<string, Function>
    private typeListeners: Map<string, TypeListener[]>
    private objectMap: Map<number, any>
    private messageId: number = 1;
    //private typeListeners:

    constructor(typeMapping: Map<string, Function>) {
        this.typeMapping = new Map();
        this.typeMapping.set('suv', ClientSuv);

        const construct: Function = this.typeMapping.get('suv');

        const test = Object.create(construct.prototype);

        console.log(construct, test);
    }

    registerTypeCreationListener(type: string, listener: TypeListener): void {
        if (this.typeListeners.has(type)) {
            const listeners = this.typeListeners.get(type);

            if (listeners.indexOf(listener) === -1) {
                listeners.push(listener);
            }
        }
        else {
            const listeners = [listener];
            this.typeListeners.set(type, listeners);
        }
    }

    receiveMessage(message: Message.Response): void {
        switch (message.type) {
            case Message.ReponseType.PROXY_CREATE:
                this.proxyCreate(<Message.ProxyCreate>message.data);
                break;
            case Message.ReponseType.PROXY_UPDATE:
                this.proxyUpdate(<Message.ProxyUpdate>message.data);
                break;
            case Message.ReponseType.PROXY_DELETE:
                

                break;
            default:
                // code...
                break;
        }
    }

    sendMessage(message: any): void {

    }

    private proxyCreate(message: Message.ProxyCreate): void {
        if (!this.typeListeners.has(message.type)) {
            //no listeners so it's not exciting (should I still create it anyway? maybe it'll be nice to allow constructors)
            return;
        }

        const func: Function = this.typeMapping.get(message.type);
        const listeners: TypeListener[] = this.typeListeners.get(message.type);
        const obj: any = (func != null) ? Object.create(func.prototype) : {};
        const objectId = message.id++;

        //copy over our values
        Object.assign(obj, message.obj);

        //add a proxy to propagate method calls 
        const {proxy, revoke} = Proxy.revocable(obj, {
            get: (target: any, key: ObjectKey) => {
                return (...args: any[]): Promise<any> => {
                    this.sendMessage({
                        type: Message.RequestType.PROXY_INVOKE,
                        data: {
                            id: objectId,
                            func: key,
                            args: args
                        }
                    });

                    return null; //should be a promise
                };
            }
        });

        //add to our watch map
        this.objectMap.set(objectId, {
            obj: obj,
            revoke: revoke
        });

        listeners.forEach((listener) => listener.apply(null, obj));
    }

    private proxyUpdate(message: Message.ProxyUpdate): void {
        if (this.objectMap.has(message.id)) {
            const obj = this.objectMap.get(message.id).obj;

            Object.assign(obj, message.obj);
        }
    }

    private proxyDelete(message: Message.ProxyDelete): void {
        if (this.objectMap.has(message.id)) {
            this.objectMap.get(message.id).revoke();
            this.objectMap.delete(message.id);
        }
    }
}

//const testConnection = new ConnectionHandler();

/*
const proxy = new Proxy({}, {
    get: (target: Object, key: string | number | symbol): any => {
        return {value: target[key], promise: null};
    },
    set: (target: Object, key: string | number | symbol, value: any): any => {
        target[key] = value;
        return null;
    }
});

console.log(proxy.a = 'hell');
console.log(proxy.b = 'hello');

var {value: test} = proxy.a

console.log(test)



const SET_LISTENERS_NAME = "setListeners";
function changeHandler<T>(): ProxyHandler<T> {
    const listeners = new Map<ObjectKey, [Function]>();

    return {
        set: (target: Object, key: ObjectKey, value: any): any => {


            return Reflect.set(target, key, value);
        }
    }
}
*/
/*
Events

action: success or failure

'SUV_LOGIN': 'SUV_LOGIN',
'SUV_LOGIN_OPEN': 'SUV_LOGIN_OPEN',
'SUV_LOGIN_REFRESH': 'SUV_LOGIN_REFRESH',
'SUV_ESB_LOGIN_OPEN': 'SUV_ESB_LOGIN_OPEN',
'WATS_RUNNER_LOGIN': 'WATS_RUNNER_LOGIN',
'CLIPBOARD_COPY': 'CLIPBOARD_COPY'

actionOnObject: success or failure but we'll propagate the changes the normal way
'EDIT_SUV_DESCRIPTION': 'EDIT_SUV_DESCRIPTION',




Change Description Flow

suv.changeDescription() -> returns a promise
calls to the backend
*

const Commands = Object.freeze({
'USER_LOGIN': 'USER_LOGIN',
'USER_LOGOUT': 'USER_LOGOUT',
'USER_GET_STATUS': 'USER_GET_STATUS',
'USER_GET_DATA': 'USER_GET_DATA',
'USER_GET_SETTINGS': 'USER_GET_SETTINGS',
'USER_SET_SETTINGS': 'USER_SET_SETTINGS',
'USER_SET_SUV_SETTINGS': 'USER_SET_SUV_SETTINGS',
'USER_UPDATE_SUV_WATS_RUNS': 'USER_UPDATE_SUV_WATS_RUNS',
'USER_GET_SUVS': 'USER_GET_SUVS',
'USER_GET_SUVS_BY_JIRA': 'USER_GET_SUVS_BY_JIRA',

'STOP_SUV': 'STOP_SUV',
'RESTART_SUV': 'RESTART_SUV',
'TERMINATE_SUV': 'TERMINATE_SUV',
'SCHEDULE_SHUTDOWN': 'SCHEDULE_SHUTDOWN',
'SCHEDULE_STARTUP': 'SCHEDULE_STARTUP',
'GET_SUV_DATA': 'GET_SUV_DATA',
'GET_POOLED_SUVS': 'GET_POOLED_SUVS',
'CREATE_SUV': 'CREATE_SUV',
    
});





enum ConnectionEvent {
    EVENT, //covers 
    CREATED,
    UPDATED
}

//TODO better name
interface Linkable extends Object {
    getLinkType: string
}

interface Message extends Object {
    event: ConnectionEvent
    object: Object
}

class Client {
    private createdTypesListeners: Map<string, [Function]>;

    constructor() {

    }

    receiveMessage(rawMessage: string) {
        const messsage: Message = <Message>JSON.parse(rawMessage);

        console.log(messsage);

    }
}





namespace ProxyUtils {

    type ObjectKey = string | number | symbol;
    export type TransformMap = Map<ObjectKey, ObjectKey>;

    //export function oneWayLink<T, V>(source: T, destination: V): T;
    export function oneWayLink<T, V>(source: T, destination: V, transformMap: TransformMap = null): T {
        const handler: ProxyHandler<T> = {};

        if (transformMap != null) {
            handler.set = (target: T, key: ObjectKey, value: any): any => {
                var destinationKey = transformMap.get(key);
                if (destinationKey == null) {
                    destinationKey = key;
                }
                Reflect.set(destination, destinationKey, value);

                return Reflect.set(target, key, value);
            };
        }
        else {
            handler.set = (target: T, key: ObjectKey, value: any): any => {
                Reflect.set(destination, key, value);

                return Reflect.set(target, key, value);
            };
        }

        return new Proxy(source, handler);
    }

    //export function dualLink<T, V>(one: T, two: V): {one: T; two: V};
    export function dualLink<T, V>(one: T, two: V, oneTransformMap: TransformMap = null, twoTransformMap: TransformMap = null): {one: T; two: V} {
        return {one: oneWayLink(one, two, oneTransformMap), two: oneWayLink(two, one, twoTransformMap)};
    }
}

function registerSuvForApi() {

}


var suvRaw = {
    wdInstanceId: 'i-12341234',
    wdDescription: 'hello'
}
var suv = {
    id: '',
    description: ''
}

suvRaw = ProxyUtils.oneWayLink(suvRaw, suv, {'wdInstanceId': 'id'})


const {suv, two} = ProxyUtils.dualLink({hello: "test", another: 1}, {hello: 'slksjd'});
one.hello = 'changed'
one.another = 2
console.log(one, two);
two.hello = 'another'
console.log(one, two);


const testClient = new Client();

class Server {
    //private types: Map<string, any>;

    constructor() {
        //this.types = new Map();
    }

    public link<T extends Linkable>(obj: T): T {

        const message: Message = {
            event: ConnectionEvent.CREATED,
            object: obj
        }
        testClient.receiveMessage(JSON.stringify(message));

        return new Proxy(obj, {
            set: (target: T, key: ObjectKey, value: any): any => {
                //const id = target.getLinkId();
                //const type = target.getLinkType();
                
                const message: Message = {
                    event: ConnectionEvent.UPDATED,
                    object: {
                        key: key,
                        value: value
                    }
                }
                testClient.receiveMessage(JSON.stringify(message));

                return Reflect.set(target, key, value);
            }
        });
    }
}

const testServer = new Server();


var testLinkable = {
    id: 1,
    type: "test",
    moreData: "testData"
}

testLinkable = testServer.link(testLinkable);

testLinkable.moreData = "testSomethingElse";





//const div: HTMLDivElement = <HTMLDivElement> document.getElementById('diviest');

*/
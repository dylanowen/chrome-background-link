/// <reference path="../../global/Global.ts"/>
/// <reference path="../../global/Debug.ts"/>

/// <reference path="../../global/application/ProxyApi.ts"/>

/// <reference path="Application.ts"/>

namespace bl {

    export interface ProxyCreatedCallback {
        (createdProxy: Object): void;
    }

    interface ProxyCreatedRef {
        clazz: new () => Object;
        callback: ProxyCreatedCallback;
    }

    export class ProxyApplication extends ApplicationImpl {
        private proxyHandlers: Map<string, ProxyCreatedRef> = new Map();
        private proxiedObjects: Map<number, Object> = new Map();

        private delayedProxies: Map<number, proxy.ProxyMessage[]> = new Map();

        registerProxy(key: string | (new() => Object), clazz: (new() => Object) | ProxyCreatedCallback, callback?: ProxyCreatedCallback): void {
            if (typeof key !== 'string' && !(key instanceof String)) {
                callback = <ProxyCreatedCallback> clazz;
                clazz = <new () => Object> key;
                key = clazz.name;
            }

            const proxyCreatedRef = {
                clazz: <new () => Object> clazz,
                callback: callback
            };
            this.proxyHandlers.set(<string>key, proxyCreatedRef);

            // try to find owners for these delayed proxies
            for (let delayedProxy of this.delayedProxies.values()) {
                const createMessage = <proxy.ProxyCreate> delayedProxy[0];

                // found an owner so lets create the instance
                if (createMessage.key === key) {
                    const instance = this.setupProxy(createMessage, proxyCreatedRef);

                    for (let i = 0; i < delayedProxy.length; i++) {
                        const updateMessage = <proxy.ProxyUpdate> delayedProxy[i];

                        this.applyProxyDelta(instance, updateMessage.data);
                    }
                }
            }
        }

        private createEvent(message: proxy.ProxyCreate): void {
            debug.verbose('Creating Proxy', message);

            const key = message.key;
            if (this.proxyHandlers.has(key)) {
                this.setupProxy(message, this.proxyHandlers.get(key));
            }
            else {
                this.delayedProxies.set(message.id, [message]);
            }
        }

        private updateEvent(message: proxy.ProxyUpdate): void {
            debug.verbose('Updating Proxy', message);

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

        private deleteEvent(message: proxy.ProxyDelete): void {
            debug.verbose('Deleting Proxy', message);

            const id = message.id;
            if (this.proxiedObjects.has(id)) {
                this.proxiedObjects.delete(id);
            }
            else if (this.delayedProxies.has(id)) {
                // if nobody has registered for this instance by now we might as well delete it
                this.delayedProxies.delete(id);
            }
            else {
                throw new Error('Couldn\'t find instance to delete: ' + id);
            }
        }

        private setupProxy(message: proxy.ProxyCreate, proxyCreatedRef: ProxyCreatedRef): Object {
            const instance = new proxyCreatedRef.clazz();

            this.proxiedObjects.set(message.id, instance);

            this.applyProxyDelta(instance, message.data);

            proxyCreatedRef.callback(instance);

            return instance;
        }

        private applyProxyDelta(proxiedInstance: Object, delta: proxy.ProxyDelta): void {
            //const proxiedInstance = this.proxiedObjects.get(id);


            for (let key in delta) {
                Reflect.set(proxiedInstance, key, <any>delta[key]);
            }
        }

        // override
        messageEvent(message: proxy.ProxyMessage): void {
            switch (message.type) {
                case proxy.Type.PROXY_CREATE:
                    this.createEvent(<proxy.ProxyCreate>message);
                    break;
                case proxy.Type.PROXY_UPDATE:
                    this.updateEvent(<proxy.ProxyUpdate>message);
                    break;
                case proxy.Type.PROXY_DELETE:
                    this.deleteEvent(<proxy.ProxyDelete>message);
                    break;
                default:
                    throw new Error('Unexpected proxy message type: ' + message.type);
            }
        }
    }
}
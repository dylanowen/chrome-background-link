/// <reference path="Application.ts"/>

/// <reference path="../../global/application/ProxyApi.ts"/>

namespace bl {

    interface ProxyReference {
        key: string
        obj: Object
    }

    export class ProxyApplication extends ApplicationImpl {
        private proxies: Map<number, ProxyReference> = new Map();
        private proxyId: number = 1;

        registerProxy<T extends Object>(key: string | (new (...args: any[]) => T), clazz?: new (...args: any[]) => T): new (...args: any[]) => T {
            if (typeof key !== 'string' && !(key instanceof String)) {
                clazz = <new (...args: any[]) => T>key;
                key = clazz.name;
            }

            const proxy = new Proxy(clazz, {
                construct: this.constructProxy.bind(this, key)
            });

            return proxy;
        }

        private constructProxy<T>(key: string, target: new (...args: any[]) => T, argumentsList: any[], newTarget: any): T {
            const realInstance: T = Reflect.construct(target, argumentsList, newTarget);
            const id = this.proxyId++;

            this.proxies.set(id, {
                key: key,
                obj: realInstance
            });

            this.broadcast({
                type: proxy.Type.PROXY_CREATE,
                key: key,
                id: id,
                data: realInstance
            });
            
            // create a proxy for this instance
            return new Proxy(realInstance, {
                set: this.setProxy.bind(this, id),
                deleteProperty: this.deleteProxy.bind(this, id)
            });
        }

        private setProxy<T>(id: number, target: T, property: ProxyProperty, value: Serializable, receiver: any): boolean {
            const delta: any = {};
            delta[property] = value;

            const updateMessage: proxy.ProxyUpdate = {
                type: proxy.Type.PROXY_UPDATE,
                id: id,
                data: delta
            }
            
            this.broadcast(updateMessage);

            return Reflect.set(target, property, value, receiver);
        }

        private deleteProxy<T>(id: number, target: T, property: ProxyProperty): boolean {
            this.broadcast({
                type: proxy.Type.PROXY_DELETE,
                id: id
            });

            this.proxies.delete(id);

            return Reflect.deleteProperty(target, property);
        }


        /**\
        registerProxy<T>(key: string | any, obj: T): any {
            if (typeof key !== 'string' && !(key instanceof String)) {
                obj = key;
                key = obj.constructor.name;
            }

            const proxy = new Proxy<T>(obj, {
                set: (target: T, property: ProxyProperty, value: Serializable, receiver: any): boolean => {
                    const result = Reflect.set(target, property, value, receiver);



                    return result;
                },
                deleteProperty: (target: T, property: ProxyProperty): boolean => {

                }
            });

            this.proxies.set(key, obj);
        }
        */

        // override
        connectionEvent(): Promise<Serializable[]> {
            const proxyCreates: Serializable[] = [];

            for (let [id, proxyRef] of this.proxies.entries()) {
                proxyCreates.push({
                    type: proxy.Type.PROXY_CREATE,
                    key: proxyRef.key,
                    id: id,
                    data: proxyRef.obj
                });
            }

            return Promise.resolve(proxyCreates);
        }

        // override
        messageEvent(message: Serializable): Promise<Object> {
            

            return null;
        }
    }
}
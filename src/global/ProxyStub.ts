namespace CBL {
    function throwProxyStubError(...args: any[]): Promise<any> { 
        throw new Error("Did not forward function call correctly");
    }

    function ProxyStub<T extends (...args: any[]) => Promise<any>>(): T {
        return <T>throwProxyStubError;
    }

    namespace ProxyStub {
        export interface Handler {
            (key: string | number | symbol, ...args: any[]): Promise<any>;
        }    

        export function injectHandler<T>(obj: T, handler: Handler): { proxy: T; revoke: () => void; } {
            handler = handler.bind(null, obj);

            return Proxy.revocable(obj, {
                get: (target: T, key: string | number | symbol) => {
                    const value: any = Reflect.get(target, key);

                    //check if we're accessing one of our stubbed functions
                    if (value === throwProxyStubError) {
                        //bind the key
                        return handler.bind(null, key);
                    }
                    
                    return value;
                }
            })
        }   
    }
}

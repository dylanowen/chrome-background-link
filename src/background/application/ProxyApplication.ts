/// <reference path="Application.ts"/>

namespace bl {
    export class ProxyApplication implements Application {
        private broadcast: Broadcast = null;

        private proxies: Map<string, any> = new Map();

        registerProxy(key: string, obj: any): any {
            
        }

        setBroadcast(broadcast: Broadcast): void {
            this.broadcast = broadcast;
        }

        connectionEvent(): Promise<Serializable> {
            // we do care about new connections
            return null;
        }

        messageEvent(message: Serializable): Promise<Object> {
            if (message instanceof Array) {
                debug.log.apply(null, message);
            }
            else {
                debug.log(message);
            }

            return null;
        }
    }
}
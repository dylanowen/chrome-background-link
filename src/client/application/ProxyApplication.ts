/// <reference path="../../global/Global.ts"/>
/// <reference path="../../global/Debug.ts"/>

/// <reference path="../../global/application/ProxyApi.ts"/>

/// <reference path="Application.ts"/>

namespace bl {
    export class ProxyApplication extends ApplicationImpl {
        constructor() {
            super();
        }

        

        createEvent(message: proxy.ProxyCreate): void {
            debug.verbose('Creating Proxy', message);
        }

        updateEvent(message: proxy.ProxyUpdate): void {
            debug.verbose('Updating Proxy', message);
        }

        deleteEvent(message: proxy.ProxyDelete): void {
            debug.verbose('Deleting Proxy', message);
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
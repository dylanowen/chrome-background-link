/// <reference path="../../global/Global.ts"/>

/// <reference path="Application.ts"/>

/*
A very basic application that logs client side errors
*/
namespace bl {
    export class ErrorApplication implements Application {
        static PATH: string = 'error';

        setBroadcast(broadcast: Broadcast): void {
            // we don't care about broadcasting
        } 

        connectionEvent(postMessage: PostMessage): void {
            // we don't care about new connections
        }

        messageEvent(message: Serializable): Promise<Object> {
            debug.error(message);

            // log and pass through the message
            return Promise.resolve(message);
        }
    }
}
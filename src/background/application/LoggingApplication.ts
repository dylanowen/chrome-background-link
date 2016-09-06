/// <reference path="Application.ts"/>

/*
A very basic application that logs client side errors
*/
namespace bl {
    export class LoggingApplication implements Application {
        setBroadcast(broadcast: Broadcast): void {
            // we don't care about broadcasting
        } 

        connectionEvent(postMessage: PostMessage): void {
            // we don't care about new connections
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
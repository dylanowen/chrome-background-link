/// <reference path="Application.ts"/>

/*
A very basic application that logs client side errors
*/
namespace bl {
    export class LoggingApplication implements Application {
        setBroadcast(broadcast: Broadcast): void {
            // we don't care about broadcasting
        } 

        connectionEvent(): Promise<Object> {
            // we don't care about new connections
            return null;
        }

        messageEvent<T>(message: T): Promise<Object> {
            debug.log(message);

            return null;
        }
    }
}
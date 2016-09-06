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

        connectionEvent(): Promise<Object> {
            // we don't care about new connections
            return null;
        }

        messageEvent<T>(message: T): Promise<Object> {
            debug.error(message);

            // log and pass through the message
            return Promise.resolve(message);
        }
    }
}
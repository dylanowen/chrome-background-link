/// <reference path="../../global/Global.ts"/>

/// <reference path="Application.ts"/>

/*
A very basic application that logs client side errors
*/
namespace bl {
    export class ErrorApplication extends ApplicationImpl {
        static PATH: string = 'error';

        messageEvent(message: Serializable): Promise<Object> {
            debug.error(message);

            // log and pass through the message
            return Promise.resolve(message);
        }
    }
}
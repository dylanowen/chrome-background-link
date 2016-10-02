/// <reference path="Application.ts"/>

/*
A very basic application that the client can call to log client side things
*/
namespace bl {
    export class LoggingApplication extends ApplicationImpl {
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
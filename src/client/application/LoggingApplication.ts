/// <reference path="../../global/Global.ts"/>
/// <reference path="../../global/Debug.ts"/>

/// <reference path="../../global/application/LoggingApi.ts"/>

/// <reference path="Application.ts"/>

namespace bl {
    export class LoggingApplication extends ApplicationImpl {
        log(...parms: Serializable[]): void {
            this.sendMessage(parms);
        }
    }
}
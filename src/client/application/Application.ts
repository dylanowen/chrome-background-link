declare namespace bl {
    export interface Application {
        messageEvent(message: Serializable): void;
    }
}
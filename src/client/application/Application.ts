namespace bl {
    export type SendMessage = (response: Serializable) => void;

    export interface Application {
        // a function the client calls to tell the application how to send messages
        setSendMessage(sendMessageFunc: SendMessage): void;

        // receive message from the server
        messageEvent(message: Serializable): void;
    }

    export abstract class ApplicationImpl implements Application {
        private sendMessageFunc: SendMessage;

        // a function the client calls to tell the application how to send messages
        setSendMessage(sendMessageFunc: SendMessage): void {
            this.sendMessageFunc = sendMessageFunc;
        }

        protected sendMessage(message: Serializable): void {
            if (this.sendMessageFunc === null) {
                throw new Error('Attempting to use an unregistered Application');
            }

            this.sendMessageFunc(message);
        }

        messageEvent(message: Serializable): void {
            // noop
        }
    }
}
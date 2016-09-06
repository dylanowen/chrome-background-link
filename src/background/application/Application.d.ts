type Connection = (message: Object) => void;
type Broadcast = (response: Object) => void;

interface Application {
    connectionEvent(connection: Connection): Promise<Object>;
    messageEvent<T>(message: T): Promise<Object>;
}
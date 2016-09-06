namespace bl {

    export type SimpleSerializable = boolean | number | string | Object

    export type Serializable = SimpleSerializable | SimpleSerializable[]
}
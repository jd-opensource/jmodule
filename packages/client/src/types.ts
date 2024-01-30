export interface ElementModifier<T> {
    (element: T): void;
}

export interface LoadOptions<T> {
    elementModifier?: ElementModifier<T>,
    autoApplyStyle?: boolean,
}

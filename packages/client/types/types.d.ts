export interface ElementModifier {
    (element: HTMLElement): void;
}
export interface LoadOptions {
    elementModifier?: ElementModifier;
    autoApplyStyle?: boolean;
}

interface ElementModifier {
    (element: HTMLElement): void;
}

interface LoadOptions {
    elementModifier?: ElementModifier,
    autoApplyStyle?: boolean,
}

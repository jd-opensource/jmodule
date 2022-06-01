interface ElementModifier {
    (element: HTMLElement): void;
}

interface FetchOptionsModifier {
    (options: { sourceUrl: string, currentUrl: string, type: string }): RequestInit;
}

interface LoadOptions {
    elementModifier?: ElementModifier,
    autoApplyStyle?: boolean,
}

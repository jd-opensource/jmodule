import { ResourceType } from '../config';
export declare function wrapperFetchedCodeHook(options: {
    currentUrl: string;
    sourceUrl: string;
    type: ResourceType;
    buffer: Uint8Array;
}): Promise<{
    currentUrl: string;
    sourceUrl: string;
    type: ResourceType;
    buffer: Uint8Array;
}[]>;

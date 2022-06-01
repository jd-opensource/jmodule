import { ResourceType } from '../config';
export declare function wrapperFetchedCodeHook(options: {
    currentUrl: string;
    sourceUrl: string;
    type: ResourceType;
    value: Blob;
}): Promise<{
    currentUrl: string;
    sourceUrl: string;
    type: ResourceType;
    value: Blob;
}[]>;

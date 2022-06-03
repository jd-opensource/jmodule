import { Resource } from '../resource';
import { ResourceType } from '../config';
interface WrapperOptions {
    currentUrl: string;
    sourceUrl: string;
    type: ResourceType;
    buffer: Uint8Array;
    resource: Resource;
}
export declare function wrapperFetchedCodeHook(options: WrapperOptions): Promise<WrapperOptions[]>;
export {};

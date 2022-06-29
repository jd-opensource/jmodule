import { Resource } from "../resource";
export declare const resourceTypes: [string, (resource: Resource, url: string) => Promise<string>][];

import { ResourceType } from '../config';

const CodePrefix = (sourceUrl: string, currentUrl: string) => `(() => {
    const options = { sourceUrl: '${sourceUrl}', currentUrl: '${currentUrl}' };
    const document = JModuleManager?.createDocument?.(options) || document;`;
const CodeSuffix = '})()';

export async function wrapperFetchedCodeHook(options: { currentUrl: string, sourceUrl: string, type: ResourceType, buffer: Uint8Array }) {
    if (!options.type.includes('javascript') || !(options.buffer instanceof Uint8Array)) {
        return [options];
    }
    const { buffer, ...others } = options;
    const encoder = new TextEncoder();
    return [{
        ...others,
        buffer: new Uint8Array([
            ...encoder.encode(`${CodePrefix(options.sourceUrl, options.currentUrl)}`),
            ...buffer,
            ...encoder.encode(`${CodeSuffix}`),
        ]),
    }];
}

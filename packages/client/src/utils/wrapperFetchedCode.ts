import { ResourceType } from '../config';

const CodePrefix = (sourceUrl: string, currentUrl: string) => `(() => {const window = JModuleManager?.createWindow({ sourceUrl: '${sourceUrl}', currentUrl: '${currentUrl}' }) || window;with(window){`;
const CodeSuffix = '}})()';

export async function wrapperFetchedCodeHook(options: { currentUrl: string, sourceUrl: string, type: ResourceType, value: Blob }) {
    if (options.type !== ResourceType.Script || !(options.value instanceof Blob)) {
        return [options];
    }
    const { currentUrl, sourceUrl, type, value } = options;
    const buffer = await value.arrayBuffer();
    const resBuffer = new Uint8Array(buffer);
    const encoder = new TextEncoder();
    const prefix = CodePrefix(sourceUrl, currentUrl);
    const suffix = CodeSuffix;
    return [{
        currentUrl, sourceUrl, type,
        value: new Blob(
            [encoder.encode(`${prefix || ''};`), resBuffer, encoder.encode(`;${suffix || ''}`)],
            { type },
        )
    }];
}

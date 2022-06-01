import { ResourceType } from '../config';

const CodePrefix = (sourceUrl: string, currentUrl: string) => `(() => {const window = JModuleManager?.createWindow({ sourceUrl: '${sourceUrl}', currentUrl: '${currentUrl}' }) || window;with(window){`;
const CodeSuffix = '}})()';

export async function resolveUrlByFetch(
    currentUrl: string,
    sourceUrl: string,
    type: ResourceType,
) {
    const resource = window.JModuleManager.getInstance('resource', sourceUrl);
    if (resource.cachedUrlMap[currentUrl]) {
        return resource.cachedUrlMap[currentUrl];
    }
    const [options] = resource.constructor.runHookSync('resource:fetch', {
        currentUrl, type, resource, fetchOptions: {},
    });
    const res = await fetch(currentUrl, options.fetchOptions);
    if (!res.ok) {
        throw new Error(`LoadScriptError: ${currentUrl}`);
    }
    if (type !== ResourceType.Script) {
        return URL.createObjectURL(await res.blob());
    }
    const resBuffer = new Uint8Array(await res.arrayBuffer());
    const encoder = new TextEncoder();
    const prefix = CodePrefix(sourceUrl, currentUrl);
    const suffix = CodeSuffix;
    return URL.createObjectURL(
        new Blob(
            [encoder.encode(`${prefix || ''};`), resBuffer, encoder.encode(`;${suffix || ''}`)],
            { type },
        ),
    );
}

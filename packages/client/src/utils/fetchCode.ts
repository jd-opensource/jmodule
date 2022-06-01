import { ResourceType } from '../config';

export async function resolveUrlByFetch(
    currentUrl: string,
    sourceUrl: string,
    type: ResourceType,
) {
    const resource = window.JModuleManager.getInstance('resource', sourceUrl);
    if (resource.cachedUrlMap[currentUrl]) {
        return resource.cachedUrlMap[currentUrl];
    }
    const [options] = await resource.constructor.runHook('resource:getFetchOptions', {
        currentUrl, type, resource, fetchOptions: {},
    });
    const response = await fetch(currentUrl, options.fetchOptions);
    if (!response.ok) {
        throw new Error(`LoadScriptError: ${currentUrl}`);
    }
    const blob = await response.blob();
    const [res] = await resource.constructor.runHook('resource:transformFetchResult', {
        currentUrl, sourceUrl, type, resource, value: blob,
    });
    return URL.createObjectURL(res.blob);
}

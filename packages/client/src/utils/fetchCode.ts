import { ResourceType } from '../config';
import { ModuleDebug } from '../debug';

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
    const response = await fetch(currentUrl, options.fetchOptions).catch((e) => {
        ModuleDebug.print({ key: currentUrl, type: 'error', instance: resource, message: e.message });
        throw e;
    });
    if (!response.ok) {
        ModuleDebug.print({ key: currentUrl, type: 'error', instance: resource, message: response.statusText });
        throw new Error(`LoadScriptError: ${currentUrl}`);
    }
    const resType = response.headers.get('Content-Type');
    if (resType && !resType.includes(type)) {
        ModuleDebug.print({ key: currentUrl, type: 'error', instance: resource, message: `${currentUrl} is not a ${type}` });
        throw new Error(`LoadScriptError: ${currentUrl} is not a ${type}`);
    }
    const buffer = await response.arrayBuffer();
    const [res] = await resource.constructor.runHook('resource:transformFetchResult', {
        currentUrl, sourceUrl,
        type: resType || type,
        resource,
        buffer: new Uint8Array(buffer),
    });
    const blob = new Blob([res.buffer], { type: resType || type });
    const url = URL.createObjectURL(blob);
    resource.cachedUrlMap[currentUrl] = url;
    return url;
}

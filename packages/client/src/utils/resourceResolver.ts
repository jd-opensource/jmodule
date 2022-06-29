import { Resource } from "../resource";

async function jsonResolver(resource: Resource, url: string) {
    const response = await fetch(url);
    const jsonText = await response.json();
    const jsString = `(window.JModuleManager && window.JModuleManager.defaultJModule || window.JModule).applyResource(${JSON.stringify(jsonText)}, "${resource.url}")`;
    const blob = new Blob([jsString], { type: 'text/javascript' });
    return URL.createObjectURL(blob);
}

// 最先处理，后续通过遍历hook来找到合适的处理方法
async function autoResolver(resource: Resource, url: string) {
    const response = await fetch(url);
    const [type] = (response.headers.get('Content-Type') || '').split(';');
    resource.type = type.split('/').pop() || resource.type;
    return URL.createObjectURL(await response.blob());
}

export const resourceTypes: [string, (resource: Resource, url: string) => Promise<string>][] = [
    ['auto', autoResolver],
    ['json', jsonResolver],
];

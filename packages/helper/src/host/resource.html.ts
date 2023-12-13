import { Resource } from '@jmodule/client';

const htmlParser = (htmlString: string) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');
    const js = [...doc.scripts].map((script) => {
        if (script.attributes.getNamedItem('src')) {
            return script.attributes.getNamedItem('src')?.value;
        }
        if (script.textContent) {
            return URL.createObjectURL(new Blob(
                [script.textContent],
                { type: script.type || 'application/javascript' },
            ));
        }
    }).filter(item => !!item);
    const css = [...doc.querySelectorAll('style, link[rel="stylesheet"]')].map(item => {
        if (item.tagName === 'LINK') {
            return item.attributes.getNamedItem('href')?.value;
        }
        if (item.tagName === 'STYLE' && item.textContent) {
            return URL.createObjectURL(new Blob(
                [item.textContent],
                { type: 'text/css' },
            ));
        }
    });
    return { js, css };
}

export default async function htmlResolver(resource: Resource, url: string) {
    const response = await fetch(url);
    const [type] = (response.headers.get('Content-Type') || '').split(';');
    if (!type.includes('html')) {
        console.warn(`资源 ${url} 实际类型为 ${type}, 期望是 'text/html', 请注意检查`);
    }
    const json = htmlParser(await response.text());
    const jsString = `(window.JModuleManager && window.JModuleManager.defaultJModule || window.JModule).applyResource(${JSON.stringify(json)}, "${resource.url}")`;
    return URL.createObjectURL(new Blob([jsString], { type: 'text/javascript' }));
}

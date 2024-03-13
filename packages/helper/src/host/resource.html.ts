import { Resource } from '@jmodule/client';

function cloneAttributes(attributes: NamedNodeMap) {
    const res: Record<string, string> = {};
    [...attributes].forEach(item => res[item.name] = item.value);
    return res;
}

const htmlParser = (htmlString: string, url: string) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');
    const jsAttributes: Record<string, Record<string, string>> = {};
    const importDeclarationReg = /(\bimport\b[\r\n\s]+[^'"]*\bfrom\b[\r\n\s]+['"])([^'"]+)(['"])/gm;
    const js = [...doc.scripts].map((script) => {
        let src;
        if (script.attributes.getNamedItem('src')) {
            src = script.attributes.getNamedItem('src')?.value;
        }
        if (script.textContent) {
            if (script.type === 'importmap') {
                // 必须使用 inline 模式, 目前不支持
                return;
            }
            if (script.type === 'module') {
                // 尚不支持 import("") 语法中的路径修正
                const targetContent = script.textContent.replace(importDeclarationReg, (wholeString, b, targetPath, d) => {
                    if (b && targetPath && d) {
                        return `${b}${new URL(targetPath, url).href}${d}`;
                    }
                    return wholeString;
                });
                src = URL.createObjectURL(new Blob(
                    [targetContent],
                    { type: 'text/javascript' },
                ));
            } else {
                src = URL.createObjectURL(new Blob(
                    [script.textContent],
                    { type: 'text/javascript' },
                ));
            }
        }
        if (src) {
            jsAttributes[src] = cloneAttributes(script.attributes);
        }
        return src;
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
    return { js, css, jsAttributes };
}

export default async function htmlResolver(resource: Resource, url: string) {
    const response = await fetch(url);
    const [type] = (response.headers.get('Content-Type') || '').split(';');
    if (!type.includes('html')) {
        console.warn(`资源 ${url} 实际类型为 ${type}, 期望是 'text/html', 请注意检查`);
    }
    const json = htmlParser(await response.text(), url);
    const jsString = `(window.JModuleManager && window.JModuleManager.defaultJModule || window.JModule).applyResource(${JSON.stringify(json)}, "${resource.url}")`;
    return URL.createObjectURL(new Blob([jsString], { type: 'text/javascript' }));
}

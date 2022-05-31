interface RequestModifier {
    (arg: { url: string, sourceUrl: string }): RequestInit;
}

const CodePrefix = (sourceUrl: string, currentUrl: string) => `with(JModuleManager?.createWindow({ sourceUrl: '${sourceUrl}', currentUrl: '${currentUrl}' }) || window){`;
const CodeSuffix = '}';

export async function resolveUrlByFetch(
    url: string,
    sourceUrl: string,
    type: 'application/javascript',
    requestModifier?: RequestModifier,
) {
    const res = await fetch(url, requestModifier ? requestModifier({ url, sourceUrl }) : undefined);
    if (!res.ok) {
        throw new Error(`LoadScriptError: ${url}`);
    }
    const resBuffer = new Uint8Array(await res.arrayBuffer());
    const encoder = new TextEncoder();
    const prefix = CodePrefix(sourceUrl, url);
    const suffix = CodeSuffix;
    return URL.createObjectURL(
        new Blob(
            [encoder.encode(`${prefix || ''};`), resBuffer, encoder.encode(`;${suffix || ''}`)],
            { type },
        ),
    );
}

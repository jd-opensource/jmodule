import { Resource } from '../resource';
import { ResourceType } from '../config';

const CodePrefix = '((context) => {const document = JModuleManager?.createDocument?.(context) || document;';
const CodeSuffix = (sourceUrl: string, currentUrl: string) => `\n})({ sourceUrl: '${ sourceUrl }', currentUrl: '${ currentUrl }' })`;

interface WrapperOptions {
    currentUrl: string;
    sourceUrl: string;
    type: ResourceType;
    buffer: Uint8Array;
    resource: Resource;
}

export async function wrapperFetchedCodeHook(options: WrapperOptions) {
    const { buffer, resource, ...others } = options;
    if (!options.type.includes('javascript')
        || !(buffer instanceof Uint8Array)
        || resource.isESM(options.currentUrl)
    ) {
        return [options];
    }
    const encoder = new TextEncoder();
    // 扩展钩子，可以定义私有变量以覆盖原全局变量，比如 history, addEventListener 以处理子应用路由
    const [{ code = '' }] = await (resource.constructor as any).runHook(
        'resource:insertPrivateVariable',
        { ...options, code: '' },
    );
    return [{
        ...others,
        resource,
        buffer: new Uint8Array([
            ...encoder.encode(CodePrefix),
            ...encoder.encode(code),
            ...buffer,
            ...encoder.encode(`${CodeSuffix(options.sourceUrl, options.currentUrl)}`),
        ]),
    }];
}

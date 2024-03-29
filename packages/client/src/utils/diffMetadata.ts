import { ResourceMetadata } from "../resource";

export function diffMetadata(source?: ResourceMetadata, target?: ResourceMetadata) {
    if (!source || !target) {
        return true;
    }
    return (<Array<keyof ResourceMetadata>>['js', 'css', 'asyncFiles']).some(
        (key: 'js'|'css'|'asyncFiles') => (source[key] || []).sort().join(',') !== (target[key] || []).sort().join(','),
    );
}

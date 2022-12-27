import { ResourceMetadata } from "../resource";

export function diffMetadata(source?: ResourceMetadata, target?: ResourceMetadata) {
    if (!source || !target) {
        return true;
    }
    return ['js', 'css', 'asyncFiles'].some(
        (key: keyof ResourceMetadata) => (source[key] || []).sort().join(',') !== (target[key] || []).sort().join(','),
    );
}

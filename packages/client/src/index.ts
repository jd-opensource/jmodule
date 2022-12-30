import './globalManager';
import { JModule, TypeHandler } from './module';

export * from './config';
export { DepResolver } from './depResolver';
export { Resource } from './resource';
export { ModuleHook } from './hook';
export { JModule, TypeHandler };
export * from './utils/eventToPromise';
export * from './utils/timeoutToPromise';

export default JModule;

import './globalManager';
import { JModule } from './module';
import type { TypeHandler } from './module';

export * from './config';
export { DepResolver } from './depResolver';
export * from './resource';
export { ModuleHook } from './hook';
export { JModule, TypeHandler };
export * from './utils/eventToPromise';
export * from './utils/timeoutToPromise';
export * from './utils/printDebugInfo';

export default JModule;

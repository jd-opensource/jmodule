export { JModuleManager } from './globalManager';
import { JModule } from './module';
import type { TypeHandler, ActivateHandler, DeactivateHandler } from './module';
export type { ModuleHookHandle } from './hook';
export * from './config';
export * from './types';
export { DepResolver } from './depResolver';
export * from './resource';
export { ModuleHook } from './hook';
export { JModule, TypeHandler, ActivateHandler, DeactivateHandler };
export * from './utils/eventToPromise';
export * from './utils/timeoutToPromise';
export * from './utils/printDebugInfo';
export default JModule;

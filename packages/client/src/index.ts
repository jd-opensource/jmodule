import './globalManager';
import { JModule, MODULE_STATUS } from './module';

export * from './config';
export { DepResolver } from './depResolver';
export { Resource } from './resource';
export { ModuleHook } from './hook';
export { MODULE_STATUS, JModule };

export default JModule;

import { JModule } from "./module";
/**
 * 模块错误
 * @class
 */
export declare class ModuleError extends Error {
    type: string;
    module: JModule;
    constructor(msg: string, module: JModule);
}
declare const _default: {};
export default _default;

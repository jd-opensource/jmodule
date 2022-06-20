import { JModule, ModuleMetadata } from '@jmodule/client';
export declare type AppTypeMetadata = ModuleMetadata & {
    bootstrap?: (module: JModule) => Promise<void>;
    mount: (module: JModule, parentEl: Element, options: {
        mountTimes: number;
    }) => Promise<void>;
    unmount?: (module: JModule, parentEl: Element) => Promise<void>;
};
export default function appTypeHandler(module: JModule, options: AppTypeMetadata): {
    activate(parentEl: Element): Promise<void>;
    deactivate(): Promise<void>;
};

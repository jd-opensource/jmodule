import { JModule } from '../module';
import { ModuleMetadata } from '../config';
declare function define(moduleKey: string, metadata: ModuleMetadata & Record<string, any>): Promise<JModule>;
declare function define(metadata: ModuleMetadata & Record<string, any>): Promise<JModule>;
export default define;

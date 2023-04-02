import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { JModule } from '@jmodule/client';

import { AppModule } from './app/app.module';

// JMddule: 修改挂载方式
if ((window as any).__JMODULE_HOST__) {
  JModule.define('childAppAngular', {
    mount(module: JModule, el: Element) {
      const root = document.createElement('app-root');
      el.appendChild(root);

      platformBrowserDynamic().bootstrapModule(AppModule)
        .catch(err => console.error(err));
    }
  });
} else {
  platformBrowserDynamic().bootstrapModule(AppModule)
    .catch(err => console.error(err));
}



/*
Copyright Google LLC. All Rights Reserved.
Use of this source code is governed by an MIT-style license that
can be found in the LICENSE file at https://angular.io/license
*/
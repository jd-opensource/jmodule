<template>
  <div class="demo-host-home">
      <div v-if="!modules.length" class="demo-host-home__placeholder">未加载子应用</div>
      <dl class="demo-host-home__module-item" v-for="item in modules" :key="item.key">
          <dt>
            <router-link :to="{ path: '/' + item.key }">{{ item.name }}({{ item.key }})</router-link>
            :
            {{ item.status }}
          </dt>
          <dd><pre>{{ JSON.stringify(item, null, '\t') }}</pre></dd>
      </dl>
  </div>
</template>

<script>
import { modules } from '../jmodule';

export default {
    data() {
        return {
            modules,
        };
    },
}
</script>

<style>
.demo-host-home__placeholder{
    height: 100px;
    line-height: 100px;
    text-align: center;
}
</style>
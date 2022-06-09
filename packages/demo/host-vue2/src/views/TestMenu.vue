<template>
  <div>
    <router-link :to="{'path': '/'}">Home</router-link>
    <div v-for="module in modules" :key="module.key" @click="activeModule(module)">
      {{ module.name }}({{ module.key }})
    </div>
  </div>
</template>

<script>
import router from '@/router';

export default {
  props: {
    modules: {
      type: Array,
      default: () => [],
    },
  },
  methods: {
    activeModule(module) {
      router.push({
        path: `/${module.key}/`,
        metadata: { module }
      });
    },
  },
}
</script>

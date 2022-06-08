<template>
  <div id="app">
    <demo-menu class="demo-menu" />
    <router-view class="demo-main"/>
  </div>
</template>

<script>
import Vue from 'vue';
import Menu from './views/TestMenu'

export default Vue.extend({
  components: { DemoMenu: Menu },
})
</script>

<style>
body{
  padding: 0;
  padding: 0 !important;
  margin: 0;
}
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  display: flex;
  height: 100vh;
}
.demo-menu{
  text-align: left;
  flex: 0 0 260px;
  border-right: 1px solid #ddd;
  background-color: #ccc;
}
.demo-menu>div{
    height: 40px;
    line-height: 40px;
    border-top: 1px solid #ddd;
    cursor: pointer;
    display: flex;
    overflow: hidden;
}
.app-root{
  text-align: left;
}
.demo-main{
  flex: 1;
  height: 100vh;
  overflow: auto;
}
</style>

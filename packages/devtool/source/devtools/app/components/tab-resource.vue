<template>
    <div class="resource-info">
        <div class="resource-info-item" v-for="item in config" :key="item[0]">
            <label for="">{{ item[1] }}:</label>
            <div class="value">
                <pre>{{ getValue(item) }}</pre>
            </div>
        </div>
    </div>
</template>

<script>
import { getResourceStatus, getResourceLoadStrategy } from './config';

const config = [
    ['url', '资源地址'],
    ['server', '服务器地址'],
    ['styleMounted', '样式已挂载'],
    ['status', '资源状态', 'getResourceStatus'],
    ['type', '资源类型'], // 入口资源类型
    ['prefix', '统一资源前缀'],
    ['preloaded', '预加载完成'],
    ['strategy', '加载策略', 'getResourceLoadStrategy'], // 默认，直接用标签方式加载
    ['cachedUrlMap', '资源映射关系', 'getObject'],
    ['metadata', '资源元数据', 'getObject'],
];
export default {
    props: ['module', 'resource', 'definition'],
    data() {
        return { config };
    },
    methods: {
        getResourceStatus(val) {
            return this.definition?.ResourceStatus?.[val] || getResourceStatus(val);
        },
        getResourceLoadStrategy(val) {
            return this.definition?.ResourceLoadStrategy?.[val] || getResourceLoadStrategy(val);
        },
        getObject(val = {}) {
            return JSON.stringify(val, null, '\t');
        },
        getValue(item = []) {
            return (item[2] ? this[item[2]](this.resource[item[0]]) : this.resource[item[0]]) || '无';
        },
    },
}
</script>

<style scoped>
.resource-info{
    display: flex;
    flex-direction: column;
    margin-bottom: 16px;
}
.resource-info-item{
    display: flex;
    width: 100%;
    align-items: top;
    margin-bottom: 8px;
}
label{
    width: 120px;
    text-align: left;
    margin-right: 8px;
}
pre{ margin: 0; }
</style>

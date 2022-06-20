<template>
    <div class="module-info">
        <div class="module-info-item" v-for="item in config" :key="item[0]">
            <label for="">{{ item[1] }}:</label>
            <div class="value">
                <pre>{{ getValue(item) }}</pre>
            </div>
        </div>
    </div>
</template>

<script>
import { getStatus } from './config';

const config = [
    ['key', '标识符'],
    ['name', '应用名称'],
    ['type', '应用类型'],
    ['_status', '应用状态'],
    ['url', '资源地址'],
    ['server', '资源域名'],
    ['isRemoteModule', '是否远程应用'],
    ['metadata', '应用元数据', 'getObject'],
];
export default {
    props: ['module'],
    data() {
        return { config };
    },
    methods: {
        getStatus,
        getObject(val = {}) {
            return JSON.stringify(val, null, '\t');
        },
        getValue(item = []) {
            return (item[2] ? this[item[2]](this.module[item[0]]) : this.module[item[0]]) || '无';
        },
    },
}
</script>

<style scoped>
.module-info{
    display: flex;
    flex-direction: column;
    margin-bottom: 16px;
}
.module-info-item{
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

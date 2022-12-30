<template>
    <div class="module-item">
        <div class="module-item-header">
            <span type="name">{{ module.name || module.key }}</span>
            <span type="key" :data-status="module._status">{{ getStatus(module._status) }}</span>
        </div>
    </div>
</template>

<script>
import { getStatus } from './config';

export default {
    props: {
        module: {
            type: Object,
            required: true
        }
    },
    data() {
        return { getStatus };
    },
};
</script>

<style scoped>
span[type="key"] {
    display: inline-block;
    background-color: #eee;
    height: 24px;
    border-radius: 12px;
    text-align: center;
    padding: 0 12px;
    line-height: 24px;
    margin-left: 8px;
}
span[type="key"][data-status="5"],
span[type="key"][data-status="done"] {
    background-color: green;
    color: #fff;
}
span[type="key"][data-status="-1"],
span[type="key"][data-status="-2"],
span[type="key"][data-status="loadFailure"],
span[type="key"][data-status="initializeFailed"],
span[type="key"][data-status="bootFailure"] {
    background-color: #b30000;
    color: #fff;
}
.module-item-header{
    display: flex;
    justify-content: space-between;
    align-items: center;
}
</style>

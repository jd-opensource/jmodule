<template>
    <div class="dashboard">
        <div class="stats">
            <div class="stat">
                <label for="total">应用总数</label>
                <div class="value" type="info">{{ modules.length }}</div>
            </div>
            <div class="stat">
                <label for="total">已加载应用</label>
                <div class="value" type="success">{{ loadedModules.length }}</div>
            </div>
            <div class="stat">
                <label for="total">异常应用</label>
                <div class="value" type="error">{{ failedModules.length }}</div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    props: ['modules', 'actions'],
    computed: {
        loadedModules() {
            return this.modules.filter(module => module._status === 5);
        },
        failedModules() {
            return this.modules.filter(module => module._status < 0);
        },
    },
}
</script>

<style scoped>
.stats{
    display: flex;
    justify-content: flex-start;
    align-items: center;
    margin-bottom: 16px;
}
.stat {
    width: 140px;
    text-align: center;
    padding: 16px;
    border: var(--border);
    margin: 16px;
}
.stat label{
    display: block;
    margin-bottom: 8px;
    font-size: 18px;
}
.stat .value{
    font-size: 24px;
}
.stat .value[type=success] {
    color: rgb(0, 128, 26);
}
.stat .value[type=error] {
    color: rgb(255, 51, 0);
}
</style>
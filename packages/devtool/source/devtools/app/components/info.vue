<template>
    <div class="module-info">
        <div class="module-info-block">
            <label type="module">ModuleInfo</label>
            <div>{{ JSON.stringify(this.getModuleInfo(), '', '\t') }}</div>
        </div>
        <div class="module-info-block">
            <label type="module">Metadata</label>
            <div>{{ JSON.stringify(this.module.metadata, '', '\t') }}</div>
        </div>
        <div class="module-info-block">
            <label type="resource">Resource</label>
            <div>{{ JSON.stringify(this.module.resource, '', '\t') }}</div>
        </div>
    </div>
</template>

<script>
export default {
    props: {
        module: {
            type: Object,
            required: true
        }
    },
    methods: {
        getModuleInfo() {
            const { resource, metadata, ...others } = this.module;
            return others;
        },
    },
};
</script>

<style scoped>

</style>

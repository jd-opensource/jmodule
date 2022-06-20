<template>
    <div>
        <div class="base">
            <div>
                <label for="">注册于:</label>
                <div class="value">{{ getDiffTime(timeMap.registered) }}</div>
            </div>
            <div v-if="timeMap.loading">
                <label for="">加载始于:</label>
                <div class="value">{{ getDiffTime(timeMap.loading) }}</div>
            </div>
            <div v-if="timeMap.loaded">
                <label for="">加载耗时:</label>
                <div class="value">{{ getDiffTime(timeMap.loaded - timeMap.loading) }}</div>
            </div>
        </div>
        <div class="timing" v-if="timeMap.loading">
            <div class="timing-title">
                <div class="event">事件</div>
                <div class="time">触发时间</div>
                <div class="duration">与上次间隔</div>
                <div class="time2">触发时间</div>
            </div>
            <template v-for="(item, i) in actions">
                <div :key="item" v-if="true" class="timing-item" :type="item[0]">
                    <div class="event">{{ getStatus(item[0]) }}</div>
                    <div class="time">{{ getDiffTime(item[1]) }}</div>
                    <div class="duration">{{ i ? getDiffTime(item[1] - actions[i - 1][1]) : '-' }}</div>
                    <div class="time2">{{ getTime(item[1]) }}</div>
                </div>
            </template>
        </div>
    </div>
</template>

<script>
import { getStatus } from './config';

function getDiffTime(time = 0) {
    const units = [['d', 86400000], ['h', 3600000], ['min', 60000], ['s', 1000], ['ms', 1]];
    let str = '';
    let t1 = time;
    units.forEach(([u, f]) => {
        const count = Math.floor(t1 / f);
        if (count) {
            str = `${str} ${count}${u}`;
        }
        t1 = t1 % f;
    });
    return str.slice(1) || '0ms';
};

export default {
    props: ['module', 'actions', 'startTime'],
    methods: {
        getStatus,
        getDiffTime,
        getTime(time) {
            return new Date(time + this.startTime).toLocaleTimeString();
        },
    },
    computed: {
        timeMap() {
            return (this.actions || []).reduce(
                (res, [status, time]) => Object.assign(res, { [getStatus(status)]: time }),
                {},
            );
        },
    },
}
</script>

<style scoped>
.base>div{
    display: flex;
    align-items: center;
    margin-bottom: var(--gutter);
}
.base label{
    width: 120px;
}

.timing-title,
.timing-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
}
.timing-title .event,
.timing-title .time,
.timing-title .time2,
.timing-title .duration{
    color: #999;
}
.event{
    width: 120px;    
}
.time{
    width: 100px;
}
.duration{
    width: 100px;
}
.time2{
    flex: 1;
}
</style>

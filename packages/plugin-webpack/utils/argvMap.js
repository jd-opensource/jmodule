const argvMap = (process.argv || []).reduce((res, item, i, arr) => {
    let key;
    let value;
    if (item.indexOf('--') === 0) {
        key = item;
        value = (arr[i + 1] || '--').indexOf('--') === 0 ? true : arr[i + 1];
        Object.assign(res, {
            [key]: value,
        });
    }
    return res;
}, {});

module.exports = argvMap;

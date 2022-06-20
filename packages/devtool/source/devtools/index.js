import browser from 'webextension-polyfill';

function createPanel() {
    return browser.devtools.panels.create(
        "JModule",
        "",
        'devtools/index.html',
    );
}
// 检测是否存在 JModule，有则打开
async function checkJModule() {
    const [hasManager] = await browser.devtools.inspectedWindow.eval('window.JModuleManager && window.JModuleManager.defaultJModule');
    const [hasJModule] = await browser.devtools.inspectedWindow.eval('window.JModule && window.JModule.registerModules');
    return hasManager || hasJModule;
}

checkJModule() && createPanel();

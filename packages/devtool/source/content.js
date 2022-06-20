// import optionsStorage from './options-storage.js';
import browser from 'webextension-polyfill';
import {
	PageMessageType,
	InitMessageType,
	DestroyMessageType,
} from './config.js';
const startTime = Date.now();

const sendMessage = (() => {
	let firstMessage = true;
	let timer;
	const messageQueue = [];
	return (messageOptions) => {
		// 由后台接收，发送给 devtools
		if (firstMessage) {
			firstMessage = false;
			browser.runtime.sendMessage({ type: InitMessageType, data: { startTime } });
		}
		messageQueue.push(messageOptions);
		clearTimeout(timer);
		timer = setTimeout(async () => {
			const d = await browser.runtime.sendMessage(messageQueue);
			messageQueue.length = 0;
		}, 300);
	}
})();

function initPage() {
	const script = document.createElement('script');
	script.src = browser.runtime.getURL('page/init.js');
	console.log(document.head.insertBefore(script, document.head.firstChild));
}

// 开始
window.addEventListener('DOMContentLoaded', initPage);

// 结束
window.addEventListener('beforeunload', () => {
	sendMessage({ type: DestroyMessageType });
});
// 接收页面消息
window.addEventListener("message", (event) => {
	const { action, data, type } = event.data || {};
	if (event.source != window || type !== PageMessageType) {
		return;
	}
	console.log('--------------message-------------');
	console.log(data)
	sendMessage({ type: action, data: data });
}, false);

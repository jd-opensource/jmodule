const chalk = require('chalk');

module.exports = function showErrorTip(msg, tip) {
    // @ts-ignore
    console.log(chalk.red(msg));
    console.log();
    console.log(`\t${tip.join('\n\t#or\n\t')}`);
    console.log();
    process.exit(0);
};

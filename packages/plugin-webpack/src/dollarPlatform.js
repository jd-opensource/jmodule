const path = require('path');

const projectName = require(path.join(process.cwd(), 'package.json')).name;

function platformResolver(...argv) {
    const callback = argv.pop();
    let request = argv.pop();
    request = request.request || request;
    const { externalAlias, importFunction, matchReg } = this;
    const newRequest = externalAlias[request] || request;
    if (newRequest === '$module.meta') {
        return callback(null, `${importFunction}('$module.meta')`, 'var');
    }
    if (matchReg.test(newRequest)) {
        const [props, scope = 'default'] = newRequest.split(':').reverse();
        return callback(null, `JModule.import('${props}', {
                projectName: '${projectName}',
                scope: '${scope}',
                server: '${projectName}',
            })`, 'var');
    }
    return callback();
}
const JModule = { JModule: 'JModule' };

class PlatformResolverPlugin {
    constructor(options = {}) {
        if (!(options.supportedNamespaces instanceof Array)) {
            throw new Error('WebpackJmodulePlugin.PlatformResolverPlugin 参数异常');
        }
        this.externalAlias = options.externalAlias || {};
        this.importFunction = options.importFunction; // required
        this.supportedNamespaces = options.supportedNamespaces; // required
        this.matchReg = new RegExp(`^([\\w]+:)?(${this.supportedNamespaces.join('|').replace(/\$/g, '\\$')})`);
    }

    apply(compiler) {
        const resolver = platformResolver.bind(this);
        if (!compiler.options.externals) {
            compiler.options.externals = [JModule, resolver];
        } else if (compiler.options.externals instanceof Array) {
            compiler.options.externals.push(JModule);
            compiler.options.externals.push(resolver);
        } else {
            compiler.options.externals = [compiler.options.externals, JModule, resolver];
        }
    }
}

module.exports = {
    PlatformResolverPlugin,
};

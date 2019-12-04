'use strict';

const { PerformanceObserver, performance } = require('perf_hooks');
const { MongoAdapter } = require('../lib');
const { newEnforcer } = require('casbin');
const chalk = require('chalk');

const enforceTimes = [];

(async() => {
    const obs = new PerformanceObserver((items) => {

        if (items.getEntries()[0].name.startsWith('Adding')) {
            console.log(chalk`${items.getEntries()[0].name} took {red ${items.getEntries()[0].duration}} ms`);
        } else {
            console.log(chalk`${items.getEntries()[0].name} took {green ${items.getEntries()[0].duration}} ms`);
        }

        if (items.getEntries()[0].name.startsWith('Enforce')) {
            enforceTimes.push(items.getEntries()[0].duration);
        }

        performance.clearMarks();
    });
    obs.observe({ entryTypes: ['measure'] });

    const getRandomInt = function(max) {
        return Math.floor(Math.random() * Math.floor(max));
    };

    try {
        const adapter = await MongoAdapter.newAdapter('SGR', 'policies');
        const e = await newEnforcer('./test/fixtures/casbin_model.txt', adapter);

        // Load policies
        performance.mark(`startloadpolicies`);
        await e.loadPolicy();
        performance.mark(`endloadpolicies`);
        performance.measure(`Loadding policies `, `startloadpolicies`, `endloadpolicies`);

        // Add Policy
        performance.mark(`startAddpolicies`);
        await e.addPolicy(`groupTest`, 'fal', 'role1', 'cmd1');
        performance.mark(`endAddpolicies`);
        performance.measure(`Adding policiy `, `startAddpolicies`, `endAddpolicies`);

        // Add Role
        performance.mark(`startAdd`);
        await e.addRoleForUser(`user-test`, `group${getRandomInt(99)}`);
        performance.mark(`endAdd`);
        performance.measure(`Adding roles to user`, `startAdd`, `endAdd`);

        // Save policies
        performance.mark(`startSave`);
        await e.savePolicy();
        performance.mark(`endSave`);
        performance.measure(`save policies`, `startSave`, `endSave`);

        // Enforce
        const maturity = ['fal', 'lab', 'map'];
        const type = ['api', 'old', 'gui'];
        const cmd = ['consult', 'import', 'extract'];

        for (let i = 0; i < 100; i++) {

            const userId = getRandomInt(2999);
            const maturityId = getRandomInt(2);
            const typeId = getRandomInt(2);
            const cmdId = getRandomInt(2);

            performance.mark(`startEnforce`);
            await e.enforce(`user${userId}`, cmd[cmdId], type[typeId], maturity[maturityId]);
            performance.mark(`endEnforce`);
            performance.measure(`Enforce`, `startEnforce`, `endEnforce`);
        }

    } catch (e) {
        console.log(e.message);
    }

    console.log(chalk`Average enforce time is {green ${enforceTimes.reduce((total, current) => total + current, 0) / enforceTimes.length}}`);
})();

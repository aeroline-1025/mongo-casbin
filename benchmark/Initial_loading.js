'use strict';

const { PerformanceObserver, performance } = require('perf_hooks');
const { MongoAdapter } = require('../lib');
const { newEnforcer } = require('casbin');
const Chalk = require('chalk');


(async() => {

    const obs = new PerformanceObserver((items) => {

        if (items.getEntries()[0].name.startsWith('Adding')) {
            console.log(Chalk`${items.getEntries()[0].name} took {red ${items.getEntries()[0].duration}}ms`);
        } else {
            console.log(Chalk`${items.getEntries()[0].name} took {green ${items.getEntries()[0].duration}}ms`);
        }

        performance.clearMarks();
    });
    obs.observe({ entryTypes: ['measure'] });

    try {
        const adapter = await MongoAdapter.newAdapter('SGR', 'policies');
        const e = await newEnforcer('./test/fixtures/casbin_model.txt', adapter);

        performance.mark(`startloadpolicies`);
        await e.loadPolicy();
        performance.mark(`endloadpolicies`);
        performance.measure(`Loadding policies `, `startloadpolicies`, `endloadpolicies`);

        const getRandomInt = function(max) {

            return Math.floor(Math.random() * Math.floor(max));
        };

        const NB_GROUPS = 25;
        const NB_APPS = 15;

        console.log('Adding policies');
        for (let i = 0; i < (NB_APPS + NB_GROUPS); ++i) {

            await e.addPolicy(`group${i}`, 'consult', 'api', 'fal');
            await e.addPolicy(`group${i}`, 'consult', 'old', 'fal');
            await e.addPolicy(`group${i}`, 'consult', 'gui', 'fal');

            await e.addPolicy(`group${i}`, 'import', 'api', 'fal');
            await e.addPolicy(`group${i}`, 'import', 'old', 'fal');
            await e.addPolicy(`group${i}`, 'import', 'gui', 'fal');

            await e.addPolicy(`group${i}`, 'extract', 'api', 'fal');
            await e.addPolicy(`group${i}`, 'extract', 'old', 'fal');
            await e.addPolicy(`group${i}`, 'extract', 'gui', 'fal');

            await e.addPolicy(`group${i}`, 'consult', 'api', 'lab');
            await e.addPolicy(`group${i}`, 'consult', 'old', 'lab');
            await e.addPolicy(`group${i}`, 'consult', 'gui', 'lab');

            await e.addPolicy(`group${i}`, 'import', 'api', 'lab');
            await e.addPolicy(`group${i}`, 'import', 'old', 'lab');
            await e.addPolicy(`group${i}`, 'import', 'gui', 'lab');

            await e.addPolicy(`group${i}`, 'extract', 'api', 'lab');
            await e.addPolicy(`group${i}`, 'extract', 'old', 'lab');
            await e.addPolicy(`group${i}`, 'extract', 'gui', 'lab');

            await e.addPolicy(`group${i}`, 'consult', 'api', 'map');
            await e.addPolicy(`group${i}`, 'consult', 'old', 'map');
            await e.addPolicy(`group${i}`, 'consult', 'gui', 'map');

            await e.addPolicy(`group${i}`, 'import', 'api', 'map');
            await e.addPolicy(`group${i}`, 'import', 'old', 'map');
            await e.addPolicy(`group${i}`, 'import', 'gui', 'map');

            await e.addPolicy(`group${i}`, 'extract', 'api', 'map');
            await e.addPolicy(`group${i}`, 'extract', 'old', 'map');
            await e.addPolicy(`group${i}`, 'extract', 'gui', 'map');

            await e.addPolicy(`group${i}`, 'admin', '*', '*');
            await e.addPolicy(`group${i}`, 'disable_lsbm', '*', '*');
        }

        performance.mark(`startSavePolicies`);
        await e.savePolicy();
        performance.mark(`endSavePolicies`);
        performance.measure(`policies `, `startSavePolicies`, `endSavePolicies`);

        console.log('Adding roles');
        let counter = 0;

        performance.mark(`startAdd${counter}`);
        for (let i = 0; i < 3000; ++i) {

            await e.addRoleForUser(`user${i}`, `group${getRandomInt(99)}`);

            if (i % 1000 === 0 && i !== 0) {
                performance.mark(`endAdd${counter}`);
                performance.measure(`Adding roles ${counter} to ${i}`, `startAdd${counter}`, `endAdd${counter}`);

                performance.mark(`start${counter}`);
                await e.savePolicy();
                performance.mark(`end${counter}`);
                performance.measure(`roles ${counter} to ${i}`, `start${counter}`, `end${counter}`);

                counter = i;
                performance.mark(`startAdd${counter}`);
            }
        }

        performance.mark(`endAddFinal`);

        performance.measure(`Adding roles ${counter} to final`, `startAdd${counter}`, `endAddFinal`);

        performance.mark(`startSave${counter}`);
        await e.savePolicy();
        performance.mark(`endSave${counter}`);

        performance.measure(`${counter} to final`, `startSave${counter}`, `endSave${counter}`);

    } catch (e) {
        console.log(e.message);
    }

    console.log('Process complete');
})();

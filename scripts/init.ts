import { run } from './init-logic';

run().catch(err => {
    console.error(err);
    process.exit(1);
});

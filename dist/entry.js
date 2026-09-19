import {initDisclosure} from './disclosure.js';
initDisclosure(document, async () => {
  await import('./app.js');
});

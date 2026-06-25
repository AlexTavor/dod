// The served admin-UI entry: boot the app on load. index.html loads this as /app.js and
// sets window.TOKEN first. dashkit is bundled in (dod-detail imports it directly); the
// standalone /dashkit.js is a separate bundle for kit projects and the shim.
import { boot } from './index';

boot();

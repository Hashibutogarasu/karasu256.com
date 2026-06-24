// src/index.ts
var index_default = {
  async scheduled(event, env, ctx) {
    console.log(`Cron triggered: ${event.cron} at ${new Date(event.scheduledTime).toISOString()}`);
  }
};
export {
  index_default as default
};
//# sourceMappingURL=index.js.map

const bot = require("../../connection/token.connection");

module.exports = bot.hears("Расклад ТАРО", async (ctx) => ctx.scene.enter("twoWizard"));
bot.command('taro', async (ctx) => ctx.scene.enter("twoWizard"));
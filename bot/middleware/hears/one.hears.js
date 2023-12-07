const bot = require('../../connection/token.connection');

bot.hears('Рассчитать совместимость', async (ctx) => ctx.scene.enter("oneWizard"));
bot.command('compatibility', async (ctx) => ctx.scene.enter("oneWizard"));
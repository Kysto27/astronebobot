const bot = require('../../connection/token.connection');

bot.hears('Администратор', async (ctx) => ctx.scene.enter("adminWizard"));
// bot.command('compatibility', async (ctx) => ctx.scene.enter("oneWizard"));
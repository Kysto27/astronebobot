const bot = require('../../connection/token.connection');

module.exports = bot.hears('Гороскопы', async (ctx) => ctx.scene.enter('threeWizard'));
bot.command('horoscope', async (ctx) => ctx.scene.enter('threeWizard'));

const { Scenes } = require('telegraf');
const bot = require('../../connection/token.connection');
const stage = require('../scene/index.scene');

module.exports = (bot) => {
  bot.command('compatibility', async (ctx) => {
    try {
      await ctx.scene.enter('oneWizard');
    } catch (error) {
      console.error('Ошибка при попытке войти в сцену:', error);
    }
  });
};

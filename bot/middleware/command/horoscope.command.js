const { Scenes } = require('telegraf');
const bot = require('../../connection/token.connection');
const stage = require('../scene/index.scene');

module.exports = bot.command('horoscope', (ctx) => {
  bot.use(stage.middleware());
  return ctx.scene.enter('threeWizard');
});
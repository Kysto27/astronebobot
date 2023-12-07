const { Scenes } = require('telegraf');
const bot = require('../../connection/token.connection');
const stage = require('../scene/index.scene');

module.exports = bot.command('taro', (ctx) => {
  bot.use(stage.middleware());
  return ctx.scene.enter('twoWizard');
});
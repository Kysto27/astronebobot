const bot = require('../../connection/token.connection');

module.exports = bot.command('commands', async (ctx) => {
  try {
    return ctx.setMyCommands([
      { command: 'start', description: 'Перезапустить бота' },
      { command: 'taro', description: 'Новый расклад ТАРО' },
      { command: 'compatibility', description: 'Новый расчет совместимости' },
    ]);
  } catch (e) {
    console.log(e);
  }
});


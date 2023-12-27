const bot = require('../../connection/token.connection');

const { Markup } = require('telegraf');
const checkUserSubscription = require('../helpers/subscriptionChecker');
const UserModel = require('../../model/user.model');

// module.exports = function (bot) {
  bot.action('check_subscription', async (ctx) => {
    const chatID = ctx.from.id;
    console.log(chatID);
    const isSubscribed = await checkUserSubscription(ctx, '@nebo_prognoz');
    if (isSubscribed) {
      await UserModel.update({ subscribeneboprognoz: true }, { where: { chatID } });
      await ctx.reply('Проверка пройдена. Добро пожаловать!');
      await ctx.replyWithHTML(
        `Выбирайте доступные функции в <b>МЕНЮ</b> 👇👇👇`,
        Markup.keyboard([['Рассчитать совместимость', 'Расклад ТАРО'], ['Гороскоп']])
          .oneTime()
          .resize()
      );
    } else {
      ctx.replyWithHTML(
        'Проверка не пройдена, необходимо подписаться на канал @nebo_prognoz',
        Markup.inlineKeyboard([Markup.button.callback('Проверить подписку', 'check_subscription')])
      );
    }
  });
// };

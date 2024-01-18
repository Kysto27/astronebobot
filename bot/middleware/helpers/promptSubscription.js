const { Markup } = require('telegraf');
async function promptSubscription(ctx) {
  const message =
    'Для использования бота нужно подписаться на канал <a href="https://t.me/+i9IuUSCQB4lmZGVi">@nebo_prognoz</a>';
  const keyboard = Markup.inlineKeyboard([
    Markup.button.callback('Проверить подписку', 'check_subscription'),
  ]);

  await ctx.replyWithHTML(message, keyboard);
}

module.exports = { promptSubscription };

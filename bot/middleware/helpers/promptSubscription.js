const { Markup } = require('telegraf');
// async function promptSubscription(ctx) {
//   const message =
//     'Для использования бота нужно подписаться на канал <a href="https://t.me/+i9IuUSCQB4lmZGVi">@nebo_prognoz</a>';
//   const keyboard = Markup.inlineKeyboard([
//     Markup.button.callback('Проверить подписку', 'check_subscription'),
//   ]);

//   await ctx.replyWithHTML(message, keyboard);
// }

// module.exports = { promptSubscription };

async function promptSubscription(ctx) {
  try {
    const message =
      'Для использования бота нужно подписаться на канал <a href="https://t.me/+i9IuUSCQB4lmZGVi">@nebo_prognoz</a>';
    const keyboard = Markup.inlineKeyboard([
      Markup.button.callback('Проверить подписку', 'check_subscription'),
    ]);

    await ctx.replyWithHTML(message, keyboard);
  } catch (e) {
    console.error(`Ошибка при отправке приглашения к подписке:`, e);
    // Здесь можно добавить дополнительные действия, например, отправку уведомления администратору
  }
}

module.exports = { promptSubscription };


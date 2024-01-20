const { Markup } = require('telegraf');
const bot = require('../../connection/token.connection');
const db = require('../../connection/db.connection');
const UserModel = require('../../model/user.model');
const path = require('path');
const checkUserSubscription = require('../../middleware/helpers/subscriptionChecker.js');
const { promptSubscription } = require('../../middleware/helpers/promptSubscription.js');

module.exports = bot.start(async (ctx) => {
  try {
    await db.sync();

    const startPayload = ctx.startPayload;
    const chatID = String(ctx.chat.id);
    const firstName = ctx.chat.first_name ?? 'anon';
    const lastName = ctx.chat.last_name ?? 'anon2';
    const username = ctx.chat.username;

    const foundUser = await UserModel.findOne({ where: { chatID: ctx.chat.id } });

    if (foundUser) {
      if (foundUser.username !== username) {
        await UserModel.update({ username }, { where: { chatID } });
      }
      if (chatID === '326045360') {
        await UserModel.update({ admin: true }, { where: { chatID } });
      }
    } else {
      await UserModel.create({
        chatID: chatID,
        firstName: firstName,
        lastName: lastName,
        username: username,
        admin: chatID === '326045360',
        startPayload: startPayload,
      });

      const imagePath = path.join(__dirname, '../../middleware/data/images/start-picture.jpg');
      await ctx.replyWithPhoto(
        { source: imagePath },
        {
          caption: `<b>🌟ДОБРО ПОЖАЛОВАТЬ🌟</b>\n\nМы приветствуем Вас в авторском телеграм боте канала @nebo_prognoz, с помощью которого вы можете:\n\n🔮 Узнать свой персональный гороскоп на 2024 год\n\n👩‍❤️‍👨 Рассчитать совместимость пары по знаку зодиака\n\n♠️ Сделать расклад ТАРО`,
          parse_mode: 'HTML',
        }
      );
    }

    // Проверка подписки на канал
    const isSubscribed = await checkUserSubscription(ctx, '@nebo_prognoz');

    if (!isSubscribed) {
      await UserModel.update({ subscribeneboprognoz: false }, { where: { chatID } });
      await promptSubscription(ctx);
      return;
    } else {
      await UserModel.update({ subscribeneboprognoz: true }, { where: { chatID } });
    }

    // Отправка клавиатуры в отдельном сообщении
    const keyboardOptions = [['Рассчитать совместимость', 'Расклад ТАРО'], ['Гороскопы']];
    if (foundUser && foundUser.admin) {
      keyboardOptions.push(['Администратор']);
    }

    return await ctx.replyWithHTML(
      `Выбирайте доступные функции в <b>МЕНЮ</b> 👇👇👇`,
      Markup.keyboard(keyboardOptions).oneTime().resize()
    );

  } catch (e) {
    console.error(`Ошибка при выполнении команды start:`, e);
  }
});

const { Markup } = require('telegraf');
const bot = require('../../connection/token.connection');
const db = require('../../connection/db.connection');
const UserModel = require('../../model/user.model');

module.exports = bot.start(async (ctx) => {
  try {
    await db.sync();

    const startPayload = ctx.startPayload;
    const chatID = String(ctx.chat.id);
    const firstName = ctx.chat.first_name ?? 'anon';
    const lastName = ctx.chat.last_name ?? 'anon2';
    const username = ctx.chat.username;

    console.log(`Проверка пользователя с chatID: ${chatID}`);
    const foundUser = await UserModel.findOne({ where: { chatID: ctx.chat.id } });

    if (foundUser) {
      console.log(`Пользователь с chatID: ${chatID} уже существует.`);
      if (foundUser.username !== username) {
        console.log(`Обновление информации пользователя с chatID: ${chatID}`);
        await UserModel.update({ username }, { where: { chatID } });
      }
    } else {
      console.log(`Пользователь с chatID: ${chatID} не найден. Создается новый пользователь.`);
      console.log(`Данные для записи:`, {
        chatID: chatID,
        firstName: firstName,
        lastName: lastName,
        username: username,
        admin: false,
        startPayload: startPayload,
      });

      await UserModel.create({
        chatID: chatID,
        firstName: firstName,
        lastName: lastName,
        username: username,
        admin: false,
        startPayload: startPayload,
      });

      console.log(`Новый пользователь с chatID: ${chatID} создан.`);
    }
    return await ctx.reply(
      'Добро пожаловать в Астрологического бота, выберите что вы хотите сделать',
      Markup.keyboard([['Раccчитать совместимость']])
        .oneTime()
        .resize()
    );
    // return ctx.replyWithHTML(`Hi, <b>${firstName}</b>!`);
  } catch (e) {
    console.error(`Ошибка при выполнении команды start:`, e);
  }
});

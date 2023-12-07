const { Markup } = require('telegraf');
const bot = require('../../connection/token.connection');
const db = require('../../connection/db.connection');
const UserModel = require('../../model/user.model');
const path = require('path');

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

      const imagePath = path.join(__dirname, '../../middleware/data/images/start-picture.jpg');
      await ctx.replyWithPhoto(
        { source: imagePath },
        {
          caption: `<b>🌟ДОБРО ПОЖАЛОВАТЬ🌟</b>\n\nМы приветствуем Вас в авторском телеграм боте канала @nebo_prognoz, с помощью которого вы можете:\n\n🔮 Узнать свой персональный гороскоп на 2024 год\n\n👩‍❤️‍👨 Рассчитать совместимость пары по знаку зодиака\n\n♠️ Сделать расклад ТАРО`,
          parse_mode: 'HTML',
        }
      );
    }

    // Отправка клавиатуры в отдельном сообщении
    return await ctx.replyWithHTML(
      `Выбирайте доступные функции в <b>МЕНЮ</b> 👇👇👇`,
      Markup.keyboard([['Рассчитать совместимость'], ['Расклад ТАРО']])
        .oneTime()
        .resize()
    );
  } catch (e) {
    console.error(`Ошибка при выполнении команды start:`, e);
  }
});

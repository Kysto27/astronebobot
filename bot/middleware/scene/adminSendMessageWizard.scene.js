const { Markup, Scenes, Composer } = require('telegraf');
const UserModel = require('../../model/user.model.js');

const messageSendingStep = new Composer();

messageSendingStep.action('send_message', async (ctx) => {
  await ctx.reply('Теперь отправьте боту то, что хотите опубликовать.');
  return ctx.wizard.next();
});

const messageReceivingStep = new Composer();

function escapeMarkdown(text) {
  return text.replace(/[_*[\]()~`>#+-=|{}.!]/g, '\\$&');
}

messageReceivingStep.on('text', async (ctx) => {
  console.log('Получено текстовое сообщение:', ctx.message.text);
  //   const escapedMessage = escapeMarkdown(ctx.message.text);
  const escapedMessage = ctx.message.text;
  ctx.wizard.state.message = ctx.message.text;
  await ctx.reply(`Ваше сообщение:\n${escapedMessage}`, {
    parse_mode: 'MarkdownV2',
    // parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [Markup.button.callback('Изменить текст', 'edit_message')],
        [Markup.button.callback('Отправить', 'confirm_send')],
        [Markup.button.callback('URL кнопки', 'add_url_buttons')],
      ],
    },
  });
  return ctx.wizard.next();
});

messageReceivingStep.on('photo', async (ctx) => {
  const photoArray = ctx.message.photo;
  const fileId = photoArray[photoArray.length - 1].file_id; // Получаем file_id последней фотографии
  ctx.wizard.state.photo = fileId; // Сохраняем file_id в состояние волшебника

  let replyText = '';

  // Если есть подпись, сохраняем её, используя функцию escapeMarkdown для экранирования спецсимволов
  if (ctx.message.caption) {
    // ctx.wizard.state.message = escapeMarkdown(ctx.message.caption);
    ctx.wizard.state.message = ctx.message.caption;
    replyText += `\n\nВаша подпись: "${ctx.wizard.state.message}"`;
  }

  await ctx.reply(replyText, {
    parse_mode: 'MarkdownV2',
    disable_web_page_preview: true,
    reply_markup: {
      inline_keyboard: [
        [Markup.button.callback('Изменить текст', 'edit_message')],
        [Markup.button.callback('Отправить', 'confirm_send')],
        [Markup.button.callback('URL кнопки', 'add_url_buttons')],
      ],
    },
  });
  return ctx.wizard.next();
});

const messageEditingStep = new Composer();

messageEditingStep.action('edit_message', async (ctx) => {
  await ctx.reply('Отправьте измененное сообщение:');
  return ctx.wizard.back(); // Возвращаемся к шагу отправки сообщения
});

messageEditingStep.action('add_url_buttons', async (ctx) => {
  await ctx.reply(
    'Отправьте список URL-кнопок в формате:\n\nКнопка 1 - http://example.com\n\nИспользуйте "|" для разделения кнопок в одном ряду.'
  );
  return ctx.wizard.next(); // Переходим к шагу ожидания ввода URL кнопок
});

messageEditingStep.action('confirm_send', async (ctx) => {
  await ctx.reply('Это сообщение будет отправлено всем пользователям телеграм-бота, вы уверены?', {
    reply_markup: {
      inline_keyboard: [
        [Markup.button.callback('Да', 'send_to_all')],
        [Markup.button.callback('Нет', 'cancel')],
      ],
    },
  });
  return ctx.wizard.selectStep(4);
});

const urlButtonsStep = new Composer();

urlButtonsStep.on('text', async (ctx) => {
  const rawText = ctx.message.text;
  // Разбиваем ввод на строки
  const rows = rawText.split('\n');
  const inlineKeyboard = [];

  for (const row of rows) {
    const buttons = row.split('|').map((buttonPart) => {
      const [text, url] = buttonPart.trim().split(' - ');
      return Markup.button.url(text, url);
    });
    inlineKeyboard.push(buttons);
  }

  // Сохраняем сформированные кнопки в состояние волшебника
  ctx.wizard.state.buttons = inlineKeyboard;
  await ctx.reply(
    'Кнопки добавлены к сообщению. Готовы отправить?',
    Markup.inlineKeyboard([
      [Markup.button.callback('Да, отправить', 'confirm_send_with_buttons')],
      [Markup.button.callback('Отмена', 'cancel')],
    ])
  );
  return ctx.wizard.next();
});

const confirmationStep = new Composer();

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createProgressBar(total, current) {
  const percentage = Math.round((current / total) * 10);
  const progressBar = '▓'.repeat(percentage) + '░'.repeat(10 - percentage);
  return `${progressBar} ${current}/${total}`;
}

confirmationStep.action('confirm_send_with_buttons', async (ctx) => {
  const photo = ctx.wizard.state.photo; // file_id фотографии
  const message = ctx.wizard.state.message; // Подпись к фото или текст сообщения
  const buttons = ctx.wizard.state.buttons; // Кнопки для сообщения
  const users = await UserModel.findAll();
  const totalUsers = users.length;
  let messageId;

  // Отправка начального сообщения о прогрессе
  const initialMessage = await ctx.reply(createProgressBar(totalUsers, 0));
  messageId = initialMessage.message_id;

  for (const [index, user] of users.entries()) {
    try {
      if (photo) {
        // Если фото доступно, отправляем его с подписью и кнопками
        await ctx.telegram.sendPhoto(user.chatID, photo, {
          caption: message,
          parse_mode: 'MarkdownV2',
          reply_markup: { inline_keyboard: buttons },
        });
      } else {
        // Если фото отсутствует, отправляем текстовое сообщение с кнопками
        await ctx.telegram.sendMessage(user.chatID, message, {
          parse_mode: 'MarkdownV2',
          reply_markup: { inline_keyboard: buttons },
        });
      }
      await UserModel.update({ lastmessagedelivered: true }, { where: { chatID: user.chatID } });
    } catch (error) {
      console.error(`Ошибка при отправке сообщения пользователю ${user.chatID}:`, error);
      await UserModel.update({ lastmessagedelivered: false }, { where: { chatID: user.chatID } });
    }

    // Обновление прогресс-бара каждые 10 сообщений
    if ((index + 1) % 10 === 0 || index === totalUsers - 1) {
      await ctx.telegram.editMessageText(
        ctx.chat.id,
        messageId,
        null,
        createProgressBar(totalUsers, index + 1),
        { parse_mode: 'MarkdownV2' }
      );
      await sleep(1000); // Задержка на 1 секунду
    }
  }

  await ctx.reply(
    'Сообщение (и фото, если было добавлено) с кнопками отправлено всем пользователям.'
  );
  return ctx.scene.leave();
});


confirmationStep.action('send_to_all', async (ctx) => {
  const message = ctx.wizard.state.message;
  const photo = ctx.wizard.state.photo;
  const users = await UserModel.findAll();
  const totalUsers = users.length;
  let messageId;

  // Отправка начального сообщения о прогрессе
  const initialMessage = await ctx.reply(createProgressBar(totalUsers, 0));
  messageId = initialMessage.message_id;

  for (const [index, user] of users.entries()) {
    try {
      if (photo) {
        // Если фото доступно, отправляем его с подписью
        await ctx.telegram.sendPhoto(user.chatID, photo, {
          caption: message,
          parse_mode: 'MarkdownV2',
        });
      } else {
        // Иначе отправляем только текстовое сообщение
        await ctx.telegram.sendMessage(user.chatID, message, { parse_mode: 'MarkdownV2' });
      }
      await UserModel.update({ lastmessagedelivered: true }, { where: { chatID: user.chatID } });
    } catch (error) {
      console.error(`Ошибка при отправке сообщения пользователю ${user.chatID}:`, error);
      await UserModel.update({ lastmessagedelivered: false }, { where: { chatID: user.chatID } });
    }

    // Обновление прогресс-бара каждые 10 сообщений
    if ((index + 1) % 10 === 0 || index === totalUsers - 1) {
      await ctx.telegram.editMessageText(
        ctx.chat.id,
        messageId,
        null,
        createProgressBar(totalUsers, index + 1),
        { parse_mode: 'MarkdownV2' }
      );
      await sleep(1000); // Задержка на 1 секунду
    }
  }

  await ctx.reply('Сообщение отправлено всем пользователям');
  return ctx.scene.leave();
});

confirmationStep.action('cancel', async (ctx) => {
  await ctx.reply('Отправка сообщения отменена.');
  return ctx.scene.leave();
});

module.exports = new Scenes.WizardScene(
  'adminSendMessageWizard',
  messageSendingStep,
  messageReceivingStep,
  messageEditingStep,
  urlButtonsStep,
  confirmationStep
);

const bot = require('../../connection/token.connection');
const { Markup, Scenes, Composer } = require('telegraf');
require('dotenv').config();

const messageSendingStep = new Composer();

messageSendingStep.action('send_message_group', async (ctx) => {
  await ctx.reply('Теперь отправьте боту то, что хотите опубликовать.');
  return ctx.wizard.next();
});

const messageReceivingStep = new Composer();

function escapeMarkdown(text) {
  return text.replace(/[_*[\]()~`>#+-=|{}.!]/g, '\\$&');
}

messageReceivingStep.on('text', async (ctx) => {
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
  const fileId = photoArray[photoArray.length - 1].file_id;
  ctx.wizard.state.photo = fileId;

  let replyText = '';

  if (ctx.message.caption) {
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
  await ctx.reply('Это сообщение будет отправлено в группу, вы уверены?', {
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

confirmationStep.action('confirm_send_with_buttons', async (ctx) => {
  const photo = ctx.wizard.state.photo; // file_id фотографии
  const message = ctx.wizard.state.message; // Подпись к фото или текст сообщения
  const buttons = ctx.wizard.state.buttons; // Кнопки для сообщения
  const groupId = process.env.LUNAR_CALEND_GROUP_CHATID;

  try {
    if (photo) {
      await bot.telegram.sendPhoto(groupId, photo, {
        caption: message,
        parse_mode: 'MarkdownV2',
        reply_markup: { inline_keyboard: buttons },
      });
    } else {
      // Иначе отправляем только текстовое сообщение
      await bot.telegram.sendMessage(groupId, message, {
        parse_mode: 'MarkdownV2',
        reply_markup: { inline_keyboard: buttons },
      });
    }
  } catch (error) {
    console.error(`Ошибка при отправке сообщения в группу`, error);
  }

  await ctx.reply('Сообщение отправлено в группу');
  return ctx.scene.leave();
});

confirmationStep.action('send_to_all', async (ctx) => {
  const message = ctx.wizard.state.message;
  const photo = ctx.wizard.state.photo;
  const groupId = process.env.LUNAR_CALEND_GROUP_CHATID;

  try {
    if (photo) {
      await bot.telegram.sendPhoto(groupId, photo, {
        caption: message,
        parse_mode: 'MarkdownV2',
      });
    } else {
      // Иначе отправляем только текстовое сообщение
      await bot.telegram.sendMessage(groupId, message, { parse_mode: 'MarkdownV2' });
    }
  } catch (error) {
    console.error(`Ошибка при отправке сообщения в группу`, error);
  }

  await ctx.reply('Сообщение отправлено в группу');
  return ctx.scene.leave();
});

confirmationStep.action('cancel', async (ctx) => {
  await ctx.reply('Отправка сообщения отменена.');
  return ctx.scene.leave();
});

module.exports = new Scenes.WizardScene(
  'adminGroupSendMessageWizard',
  messageSendingStep,
  messageReceivingStep,
  messageEditingStep,
  urlButtonsStep,
  confirmationStep
);

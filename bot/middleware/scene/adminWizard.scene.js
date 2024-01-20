const { Markup, Scenes, Composer } = require('telegraf');
const UserModel = require('../../model/user.model.js');

const adminStartStep = new Composer();

adminStartStep.use(async (ctx) => {
  if (ctx.chat.id.toString() === '326045360') {
    await ctx.reply(
      'Добро пожаловать в администраторскую часть бота, выберите что хотите сделать.',
      {
        reply_markup: {
          inline_keyboard: [[Markup.button.callback('Отправить сообщение', 'send_message')]],
        },
      }
    );
    return ctx.wizard.next();
  } else {
    await ctx.reply('Извините, у вас нет доступа к этой функции.');
    return ctx.scene.leave();
  }
});

const messageSendingStep = new Composer();

messageSendingStep.action('send_message', async (ctx) => {
  await ctx.reply('Теперь отправьте боту то, что хотите опубликовать.');
  return ctx.wizard.next();
});

const messageReceivingStep = new Composer();

// messageReceivingStep.on('text', async (ctx) => {
//   ctx.wizard.state.message = ctx.message.text;
//   await ctx.reply(`Ваше сообщение: "${ctx.wizard.state.message}"`, {
//     reply_markup: {
//       inline_keyboard: [
//         [Markup.button.callback('Изменить текст', 'edit_message')],
//         [Markup.button.callback('Отправить', 'confirm_send')],
//       ],
//     },
//   });
//   return ctx.wizard.next();
// });
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

messageEditingStep.action('confirm_send', async (ctx) => {
  await ctx.reply('Это сообщение будет отправлено всем пользователям телеграм-бота, вы уверены?', {
    reply_markup: {
      inline_keyboard: [
        [Markup.button.callback('Да', 'send_to_all')],
        [Markup.button.callback('Нет', 'cancel')],
      ],
    },
  });
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

confirmationStep.action('send_to_all', async (ctx) => {
  const message = ctx.wizard.state.message;
  const users = await UserModel.findAll();
  const totalUsers = users.length;
  let messageId;

  // Отправка начального сообщения о прогрессе
  const initialMessage = await ctx.reply(createProgressBar(totalUsers, 0));
  messageId = initialMessage.message_id;

  for (const [index, user] of users.entries()) {
    try {
      await ctx.telegram.sendMessage(user.chatID, message, { parse_mode: 'MarkdownV2' });
      await UserModel.update({ lastmessagedelivered: true }, { where: { chatID: user.chatID } });
    } catch (error) {
      console.error(`Ошибка при отправке сообщения пользователю ${user.chatID}:`, error);
      await UserModel.update({ lastmessagedelivered: false }, { where: { chatID: user.chatID } });
    }

    // Обновление прогресс-бара каждые 10 сообщений
    if ((index + 1) % 2 === 0 || index === totalUsers - 1) {
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

  await ctx.reply('Сообщение отправлено всем пользователям.');
  return ctx.scene.leave();
});

confirmationStep.action('cancel', async (ctx) => {
  await ctx.reply('Отправка сообщения отменена.');
  return ctx.scene.leave();
});

module.exports = new Scenes.WizardScene(
  'adminWizard',
  adminStartStep,
  messageSendingStep,
  messageReceivingStep,
  messageEditingStep,
  confirmationStep
);

const { Markup, Scenes, Composer } = require('telegraf');

const adminStartStep = new Composer();

adminStartStep.use(async (ctx) => {
  if (ctx.chat.id.toString() === '326045360') {
    await ctx.reply(
      'Добро пожаловать в администраторскую часть бота, выберите что хотите сделать.',
      {
        reply_markup: {
          inline_keyboard: [
            [Markup.button.callback('Отправить сообщение в бота', 'send_message')],
            [Markup.button.callback('Отправить сообщение в группу', 'send_message_group')],
          ],
        },
      }
    );
    return ctx.wizard.next();
  } else {
    await ctx.reply('Извините, у вас нет доступа к этой функции.');
    return ctx.scene.leave();
  }
});

const adminCategoryStep = new Composer();

adminCategoryStep.action('send_message', async (ctx) => {
  await ctx.scene.enter('adminSendMessageWizard');
});

adminCategoryStep.action('send_message_group', async (ctx) => {
  await ctx.scene.enter('adminGroupSendMessageWizard');
});

module.exports = new Scenes.WizardScene('adminWizard', adminStartStep, adminCategoryStep);

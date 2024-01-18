const { Markup, Scenes, Composer } = require('telegraf');
const { createZodiacSignsKeyboard } = require('../helpers/zodiacSignsKeyboard.js');
const { ZodiacSign, ZodiacCompatibility } = require('../../../models/index.js');
const UserModel = require('../../model/user.model.js');
// const checkUserSubscription = require('../helpers/subscriptionChecker');
// const { promptSubscription } = require('../helpers/promptSubscription.js');
const { handleSubscription } = require('../helpers/sceneSubscription.js');


const chooseWomanSignStep = new Composer();

// chooseWomanSignStep.use(async (ctx, next) => {
//   const chatID = ctx.from.id;
//   const isSubscribed = await checkUserSubscription(ctx, '@nebo_prognoz');

//   if (!isSubscribed) {
//     await UserModel.update({ subscribeneboprognoz: false }, { where: { chatID } });
//     await promptSubscription(ctx);
//   } else {
//     await UserModel.update({ subscribeneboprognoz: true }, { where: { chatID } });
//     await enterWomanSignStep(ctx);
//   }
// });

// chooseWomanSignStep.use(async (ctx, next) => {
//   const chatID = ctx.from.id;
//   const user = await UserModel.findOne({ where: { chatID } });

//   // Сохраняем первоначальный статус подписки, если он еще не был установлен
//   if (
//     user.subscribeneboprognoz === false &&
//     ctx.wizard.state.initialSubscribeStatus === undefined
//   ) {
//     ctx.wizard.state.initialSubscribeStatus = 'unsubscribed';
//   }

//   const isSubscribed = await checkUserSubscription(ctx, '@nebo_prognoz');

//   if (!isSubscribed) {
//     await UserModel.update({ subscribeneboprognoz: false }, { where: { chatID } });
//     await promptSubscription(ctx);
//   } else {
//     await UserModel.update({ subscribeneboprognoz: true }, { where: { chatID } });
//     // Проверяем, был ли пользователь ранее не подписанным
//     if (ctx.wizard.state.initialSubscribeStatus === 'unsubscribed') {
//       // Увеличиваем счетчик подписок на канал
//       await UserModel.increment('channeljoincount', { by: 1, where: { chatID } });
//       // Обновляем статус в контексте wizard
//       ctx.wizard.state.initialSubscribeStatus = 'subscribed';
//     }
//     await enterWomanSignStep(ctx);
//   }
// });
chooseWomanSignStep.use(async (ctx, next) => {
  await handleSubscription(ctx, enterWomanSignStep);
});

async function enterWomanSignStep(ctx) {
  try {
    ctx.wizard.state.formData = {};
    await ctx.replyWithHTML(`<b>💃 Выберите знак зодиака Женщины</b>`, {
      reply_markup: createZodiacSignsKeyboard(),
    });
    return ctx.wizard.next();
  } catch (e) {
    console.log(e);
  }
}

const chooseManSignStep = new Composer();
chooseManSignStep.action(/^\d{1,2}$/, async (ctx) => {
  const zodiacSignId = ctx.match[0];
  ctx.wizard.state.formData.womanZodiacSign = zodiacSignId;
  try {
    const zodiacSign = await ZodiacSign.findByPk(zodiacSignId);
    if (zodiacSign) {
      await ctx.reply(`Вы выбрали знак зодиака Женщины - ${zodiacSign.emoji} ${zodiacSign.name}`);
    } else {
      await ctx.reply('Знак зодиака не найден');
    }
  } catch (error) {
    console.error('Ошибка при запросе к базе данных:', error);
  }
  await ctx.replyWithHTML(`<b>👨‍🦳 Теперь выберите знак зодиака Мужчины</b>`, {
    reply_markup: createZodiacSignsKeyboard(),
  });
  return ctx.wizard.next();
});

const compatibilityCalcStep = new Composer();
compatibilityCalcStep.action(/^\d{1,2}$/, async (ctx) => {
  const zodiacWomanSignId = ctx.wizard.state.formData.womanZodiacSign;
  const zodiacManSignId = ctx.match[0];
  ctx.wizard.state.formData.manZodiacSign = zodiacManSignId;
  let zodiacWomanSign, zodiacManSign;

  try {
    zodiacManSign = await ZodiacSign.findByPk(zodiacManSignId);
    if (!zodiacManSign) {
      await ctx.reply('Знак зодиака Мужчины не найден');
    } else {
      await ctx.reply(
        `Вы выбрали знак зодиака Мужчины - ${zodiacManSign.emoji} ${zodiacManSign.name}`
      );
    }
  } catch (error) {
    console.error('Ошибка при запросе к базе данных:', error);
  }

  try {
    zodiacWomanSign = await ZodiacSign.findByPk(zodiacWomanSignId);
    if (!zodiacWomanSign) {
      await ctx.reply('Знак зодиака Женщины не найден');
    }
  } catch (error) {
    console.error('Ошибка при запросе к базе данных:', error);
  }

  if (zodiacWomanSign && zodiacManSign) {
    await ctx.replyWithHTML(
      `Теперь нажмите кнопку, чтобы рассчитать совместимость:\n\nЖенщина - ${zodiacWomanSign.name} ${zodiacWomanSign.emoji} + ${zodiacManSign.emoji} ${zodiacManSign.name} - Мужчина`,
      Markup.inlineKeyboard([
        Markup.button.callback('Рассчитать совместимость', 'calculate_compatibility'),
      ])
    );
  }

  return ctx.wizard.next();
});

const finishStep = new Composer();
finishStep.action('calculate_compatibility', async (ctx) => {
  try {
    await ctx.answerCbQuery();
    const zodiacWomanSignId = ctx.wizard.state.formData.womanZodiacSign;
    const zodiacManSignId = ctx.wizard.state.formData.manZodiacSign;
    const chatID = ctx.update.callback_query.from.id; // Получение chatID пользователя

    // Запрос к базе данных для получения данных о совместимости
    const compatibility = await ZodiacCompatibility.findOne({
      where: {
        woman_zodiac_sign: zodiacWomanSignId,
        man_zodiac_sign: zodiacManSignId,
      },
    });

    if (compatibility) {
      // Формируем сообщение с данными о совместимости
      const message = `
        <b>Процент совместимости:</b> ${compatibility.compatibility_percent}%\n
        <i>${compatibility.compatibility_description}</i>
      `;
      await ctx.replyWithHTML(message);
    } else {
      await ctx.reply('Данные о совместимости не найдены');
    }

    // Увеличиваем счетчик расчетов совместимости для пользователя
    await UserModel.increment('compatibilityCalculationsCount', { by: 1, where: { chatID } });

    return ctx.scene.leave();
  } catch (e) {
    console.error(e);
    await ctx.reply('Произошла ошибка при получении данных о совместимости');
  }
});

module.exports = new Scenes.WizardScene(
  'oneWizard',
  chooseWomanSignStep,
  chooseManSignStep,
  compatibilityCalcStep,
  finishStep
);

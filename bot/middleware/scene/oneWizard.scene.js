const { Markup, Scenes, Composer } = require('telegraf');
const { createZodiacSignsKeyboard } = require('../helpers/zodiacSignsKeyboard.js');
const { ZodiacSign, ZodiacCompatibility } = require('../../../models/index.js');
const UserModel = require('../../model/user.model.js');

const chooseWomanSignStep = new Composer();

chooseWomanSignStep.hears('Рассчитать совместимость', enterWomanSignStep);
chooseWomanSignStep.command('compatibility', enterWomanSignStep);

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

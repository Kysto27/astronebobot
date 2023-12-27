const { Markup, Scenes, Composer } = require('telegraf');
const { createZodiacSignsKeyboard } = require('../helpers/zodiacSignsKeyboard.js');
const { getZodiacSignInGenitive } = require('../helpers/zodiacSignInGenitive.js');
const { getHoroscope } = require('../helpers/getHoroscope.js');
const { ZodiacSign } = require('../../../models/index.js');
const UserModel = require('../../model/user.model.js');
const checkUserSubscription = require('../helpers/subscriptionChecker');

const startStep = new Composer();

startStep.use(async (ctx, next) => {
  const chatID = ctx.from.id;
  const isSubscribed = await checkUserSubscription(ctx, '@nebo_prognoz');

  if (!isSubscribed) {
    await ctx.replyWithHTML(
      'Для использования бота нужно подписаться на канал @nebo_prognoz',
      Markup.inlineKeyboard([Markup.button.callback('Проверить подписку', 'check_subscription')])
    );
  } else {
    await UserModel.update({ subscribeneboprognoz: true }, { where: { chatID } });
    await enterStartStep(ctx);
  }
});

// startStep.hears('Гороскоп', enterStartStep);
// startStep.command('horoscope', enterStartStep);

async function enterStartStep(ctx) {
  try {
    ctx.wizard.state.formData = {};
    await ctx.replyWithHTML(
      `<b>Привет! Здесь ты можешь получить гороскоп на следующий год</b>👇👇👇`,
      {
        reply_markup: {
          inline_keyboard: [[Markup.button.callback('Гороскоп на 2024 год', 'horo24')]],
        },
      }
    );
    return ctx.wizard.next();
  } catch (e) {
    console.log(e);
  }
}

const genderSelectionStep = new Composer();
genderSelectionStep.action('horo24', async (ctx) => {
  try {
    await ctx.reply(
      'Выберите, для кого вы хотите узнать гороскоп на 2024 год',
      Markup.inlineKeyboard([
        Markup.button.callback('Мужчина', 'муж'),
        Markup.button.callback('Женщина', 'жен'),
      ])
    );
    return ctx.wizard.next();
  } catch (e) {
    console.log(e);
  }
});

// Этот шаг реагирует на выбор пола и предлагает выбрать знак зодиака
const zodiacSignSelectionStep = new Composer();
zodiacSignSelectionStep.action(['муж', 'жен'], async (ctx) => {
  try {
    // Сохранение выбранного пола в state
    // ctx.wizard.state.formData.gender = ctx.match[0].split('_')[1];
    ctx.wizard.state.formData.gender = ctx.match[0];
    console.log(ctx.wizard.state.formData.gender);
    await ctx.reply('Теперь выберите знак зодиака', {
      reply_markup: createZodiacSignsKeyboard(),
    });
    return ctx.wizard.next();
  } catch (e) {
    console.log(e);
  }
});

const horoscopeStep = new Composer();

// Обработка выбора знака зодиака по числовому идентификатору
horoscopeStep.action(/(\d+)/, async (ctx) => {
  try {
    const zodiacSignId = parseInt(ctx.match[1], 10);
    const zodiacSign = await ZodiacSign.findByPk(zodiacSignId);
    const chatID = ctx.update.callback_query.from.id;

    const gender = ctx.wizard.state.formData.gender === 'муж' ? 'мужчины' : 'женщины';
    const zodiacSignNameInGenitive = getZodiacSignInGenitive(zodiacSign.name);
    const horoscope = await getHoroscope(zodiacSign.id, ctx.wizard.state.formData.gender);
    
    if (horoscope) {
      await ctx.replyWithHTML(
        `<b>Гороскоп для ${gender} - ${zodiacSignNameInGenitive} ${
          zodiacSign.emoji || ''
        } на 2024 год:</b>\n\n${horoscope.general}`
      );
    } else {
      await ctx.reply('Извините, информация о гороскопе не найдена.');
    }
    await UserModel.increment('horoscoperequestscount', { by: 1, where: { chatID } });
    return ctx.scene.leave();
  } catch (e) {
    console.log(e);
    await ctx.reply('Произошла ошибка.');
  }
});

module.exports = new Scenes.WizardScene(
  'threeWizard',
  startStep,
  genderSelectionStep,
  zodiacSignSelectionStep,
  horoscopeStep
);

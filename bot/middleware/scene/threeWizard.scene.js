const { Markup, Scenes, Composer } = require('telegraf');
const { createZodiacSignsKeyboard } = require('../helpers/zodiacSignsKeyboard.js');
const { getZodiacSignInGenitive } = require('../helpers/zodiacSignInGenitive.js');
const { getHoroscope } = require('../helpers/getHoroscope.js');
const { ZodiacSign, HoroscopeCurWeek, HoroscopePrevWeek } = require('../../../models/index.js');
const UserModel = require('../../model/user.model.js');
const { handleSubscription } = require('../helpers/sceneSubscription.js');

async function getDateRangeForZodiacSign(ZodiacSignId, Model) {
  try {
    const record = await Model.findOne({
      where: { zodiac_sign_id: ZodiacSignId },
      attributes: ['date_range'],
    });
    return record ? record.date_range : null;
  } catch (error) {
    console.error('Ошибка при получении диапазона дат:', error);
    return null;
  }
}

const startStep = new Composer();

startStep.use(async (ctx, next) => {
  await handleSubscription(ctx, enterStartStep);
});

async function enterStartStep(ctx) {
  try {
    ctx.wizard.state.formData = {};
    await ctx.replyWithHTML(
      `<b>🌟 Добро пожаловать в раздел Гороскопов! 🌟</b>

Здесь вы можете узнать, что звёзды готовят для вас на предстоящую неделю и весь год. Выберите, что вас интересует:
      
<b>🔮 Гороскоп на неделю</b> - получите подробный прогноз на предстоящие семь дней:
      ✨ <b><i>Общий гороскоп</i></b>
      ❤️ <b><i>Любовный гороскоп</i></b>
      💰 <b><i>Финансовый гороскоп</i></b>
      🍏 <b><i>Гороскоп здоровья</i></b>
      💄 <b><i>Гороскоп красоты</i></b>
      
<b>🌌 Годовой гороскоп</b> - узнайте, что ожидает вас в течение всего года.
      
<b>Выберите один из вариантов ниже, чтобы продолжить</b> 👇`,
      {
        reply_markup: {
          inline_keyboard: [
            [Markup.button.callback('Гороскоп на НЕДЕЛЮ', 'horoWeek')],
            [Markup.button.callback('Гороскоп на 2024 год', 'horo24')],
          ],
        },
      }
    );
    return ctx.wizard.next();
  } catch (e) {
    console.log(e);
  }
}

const typeSelectionStep = new Composer();

typeSelectionStep.action('horoWeek', async (ctx) => {
  try {
    // Получаем диапазон дат для текущей и предыдущей недели
    const curWeekDateRange = await getDateRangeForZodiacSign(1, HoroscopeCurWeek);
    const prevWeekDateRange = await getDateRangeForZodiacSign(1, HoroscopePrevWeek);

    // Проверяем, получили ли мы диапазоны дат
    if (!curWeekDateRange || !prevWeekDateRange) {
      await ctx.reply('Извините, информация о диапазонах дат не найдена.');
      return;
    }

    ctx.wizard.state.dateRanges = {
      curWeek: curWeekDateRange,
      prevWeek: prevWeekDateRange,
    };

    // Используем диапазоны дат в названиях кнопок
    await ctx.replyWithHTML(
      `👇 Сначала выберите неделю 👇`,
      Markup.inlineKeyboard([
        Markup.button.callback(`${prevWeekDateRange}`, 'prevWeek'),
        Markup.button.callback(`${curWeekDateRange}`, 'curWeek'),
      ])
    );
    return ctx.wizard.selectStep(2);
    // return ctx.wizard.next();
  } catch (error) {
    console.error('Ошибка:', error);
    await ctx.reply('Произошла ошибка.');
  }
});

typeSelectionStep.action('horo24', async (ctx) => {
  try {
    await ctx.reply(
      'Выберите, для кого вы хотите узнать гороскоп на 2024 год',
      Markup.inlineKeyboard([
        Markup.button.callback('Мужчина', 'муж'),
        Markup.button.callback('Женщина', 'жен'),
      ])
    );
    return ctx.wizard.selectStep(5);
    // return ctx.wizard.next();
  } catch (e) {
    console.log(e);
  }
});

const zodiacWeekSelectionStep = new Composer();

zodiacWeekSelectionStep.action(['prevWeek', 'curWeek'], async (ctx) => {
  ctx.wizard.state.selectedWeek = ctx.match[0];

  await ctx.reply('Теперь выберите знак зодиака', {
    reply_markup: createZodiacSignsKeyboard(),
  });
  return ctx.wizard.next();
});

const horoscopeTypeSelectionStep = new Composer();

horoscopeTypeSelectionStep.action(/(\d+)/, async (ctx) => {
  try {
    const zodiacSignId = parseInt(ctx.match[1], 10);
    const zodiacSign = await ZodiacSign.findByPk(zodiacSignId);
    ctx.wizard.state.selectedZodiacSign = zodiacSign;
    const selectedWeek = ctx.wizard.state.selectedWeek;
    const dateRange = ctx.wizard.state.dateRanges[selectedWeek];
    await ctx.reply(
      `Выберите вид гороскопа на ${dateRange} для знака зодиака - ${zodiacSign.name} ${
        zodiacSign.emoji || ''
      }:`,

      Markup.inlineKeyboard([
        [
          Markup.button.callback('❤️Любовный', 'love'),
          Markup.button.callback('💰Финансовый', 'business'),
        ],
        [
          Markup.button.callback('🍏Здоровье', 'health'),
          Markup.button.callback('💄Красота', 'beauty'),
        ],
        [Markup.button.callback('✨Общий', 'common')],
        // Добавьте другие кнопки по необходимости
      ])
    );
    return ctx.wizard.next();
  } catch (error) {
    console.error('Ошибка:', error);
    await ctx.reply('Произошла ошибка.');
  }
});

const horoscopeTypes = {
  love: 'Любовный гороскоп',
  business: 'Финансовый гороскоп',
  health: 'Гороскоп здоровья',
  beauty: 'Гороскоп красоты',
  common: 'Общий гороскоп',
};

const horoscopeResultStep = new Composer();

horoscopeResultStep.action(['love', 'business', 'health', 'beauty', 'common'], async (ctx) => {
  try {
    const chatID = ctx.update.callback_query.from.id;
    const selectedType = ctx.match[0];
    const selectedWeek = ctx.wizard.state.selectedWeek;
    const zodiacSignId = ctx.wizard.state.selectedZodiacSign.id;
    const Model = selectedWeek === 'curWeek' ? HoroscopeCurWeek : HoroscopePrevWeek;

    const horoscope = await Model.findOne({
      where: { zodiac_sign_id: zodiacSignId },
    });

    if (!horoscope || !horoscope[selectedType]) {
      await ctx.reply('Извините, информация о гороскопе не найдена.');
      return ctx.scene.leave();
    }

    const horoscopeName = horoscopeTypes[selectedType];

    await ctx.replyWithHTML(
      `<b>${horoscopeName} на ${ctx.wizard.state.dateRanges[selectedWeek]} для знака зодиака - ${
        ctx.wizard.state.selectedZodiacSign.name
      } ${ctx.wizard.state.selectedZodiacSign.emoji || ''}:</b>\n\n${horoscope[selectedType]}`,
      Markup.inlineKeyboard([Markup.button.callback('Посмотреть другой знак', 'chooseAnotherSign')])
    );
    await UserModel.increment('horoscoperequestscount', { by: 1, where: { chatID } });
    // return ctx.scene.leave();
  } catch (error) {
    console.error('Ошибка:', error);
    await ctx.reply('Произошла ошибка.');
    return ctx.scene.leave();
  }
});

horoscopeResultStep.action('chooseAnotherSign', async (ctx) => {
  await ctx.reply('Выберите знак зодиака', {
    reply_markup: createZodiacSignsKeyboard(),
  });
  return ctx.wizard.selectStep(3); // Номер шага, где пользователь выбирает знак зодиака
});

const zodiacSignSelectionStep = new Composer();
zodiacSignSelectionStep.action(['муж', 'жен'], async (ctx) => {
  try {
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
  typeSelectionStep,
  zodiacWeekSelectionStep,
  horoscopeTypeSelectionStep,
  horoscopeResultStep,
  zodiacSignSelectionStep,
  horoscopeStep
);

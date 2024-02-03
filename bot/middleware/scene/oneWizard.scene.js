const { Markup, Scenes, Composer } = require('telegraf');
const { createZodiacSignsKeyboard } = require('../helpers/zodiacSignsKeyboard.js');
const {
  ZodiacSign,
  ZodiacCompatibility,
  NumerologyCompatibilityDescription,
} = require('../../../models/index.js');
const UserModel = require('../../model/user.model.js');
const { handleSubscription } = require('../helpers/sceneSubscription.js');
const { isValidDate } = require('../helpers/isValidDate.js');

const startStep = new Composer();

startStep.use(async (ctx, next) => {
  await handleSubscription(ctx, enterStartStep);
});

async function enterStartStep(ctx) {
  try {
    ctx.wizard.state.formData = {};
    await ctx.replyWithHTML(
      `<b>🌟 Добро пожаловать в раздел совместимости! 🌟</b>

Мы подготовили для вас 2 вида для определения совместимости:

♈️<b><i>Совместимость по знаку зодиака</i></b>

👩‍❤️‍👨<b><i>Нумерологический портрет пары по дате рождения</i></b>

<b>Выберите один из вариантов ниже, чтобы продолжить</b> 👇`,
      {
        reply_markup: {
          inline_keyboard: [
            [Markup.button.callback('По знакам зодиака', 'compatibility_zodiac')],
            [Markup.button.callback('Нумерологический портрет пары', 'compatibility_numerology')],
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

typeSelectionStep.action('compatibility_zodiac', async (ctx) => {
  try {
    ctx.wizard.state.formData = {};
    await ctx.replyWithHTML(`<b>💃 Выберите знак зодиака Женщины</b>`, {
      reply_markup: createZodiacSignsKeyboard(),
    });
    return ctx.wizard.next();
  } catch (e) {
    console.log(e);
  }
});

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

    const compatibility = await ZodiacCompatibility.findOne({
      where: {
        woman_zodiac_sign: zodiacWomanSignId,
        man_zodiac_sign: zodiacManSignId,
      },
    });

    if (compatibility) {
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

typeSelectionStep.action('compatibility_numerology', async (ctx) => {
  try {
    ctx.wizard.state.formData = {
      type: 'numerology',
    };
    await ctx.replyWithHTML(
      `👩‍❤️‍👨 Мы предлагаем Вам узнать интересный нумерологический портрет Вашей пары. Для каждого партнёрства есть своё число, которое отражает всю суть отношений.

📅<b>Для расчёта Вам необходимо знать только полную дату рождения.</b>

Чтобы рассчитать совместимость, надо суммировать все цифры даты рождения партнёров, пока у Вас не получится число от 1 до 9. 
<blockquote>Например, 10 января 1970 года – дата рождения мужчины, 26 сентября 1976 года – женщины. Складываем цифры: 1+1+1+9+7=19=10=1 (это его цифра) и 2+6+9+1+9+7+6=40=4 (это её цифра). Число пары в сумме составляет 5.</blockquote>

<b>В нашем боте это сделать еще проще, достаточно ввести даты рождения. Мы рассчитаем число вашей пары и дадим его расшифровку.</b>👇👇👇
`
    );

    await ctx.reply('👨‍🦰Отправьте сообщением дату рождения мужчины (в формате ДД.ММ.ГГГГ):');
    return ctx.wizard.selectStep(5);
  } catch (e) {
    console.log(e);
  }
});

const enterManBirthdateStep = new Composer();

enterManBirthdateStep.on('text', async (ctx) => {
  const inputText = ctx.message.text;

  switch (inputText) {
    case 'Рассчитать совместимость':
      return ctx.scene.enter('oneWizard');

    case '/compatibility':
      return ctx.scene.enter('oneWizard');

    case 'Расклад ТАРО':
      return ctx.scene.enter('twoWizard');

    case '/taro':
      return ctx.scene.enter('twoWizard');

    case 'Гороскопы':
      return ctx.scene.enter('threeWizard');

    case '/horoscope':
      return ctx.scene.enter('threeWizard');

    case 'Администратор':
      return ctx.scene.enter('adminWizard');

    case '/start':
      await ctx.scene.leave();
      return await ctx.replyWithHTML(
        `Вы вышли из текущего раздела.
Выбирайте доступные функции в <b>МЕНЮ</b> 👇👇👇`
      );

    default:
      // Проверка на валидность даты
      if (!isValidDate(inputText)) {
        await ctx.reply('Дата введена некорректно, попробуйте снова (в формате ДД.ММ.ГГГГ):');
        return; // Оставляем пользователя на этом же шаге для повторного ввода
      }

      // Если текст прошел проверку как валидная дата, продолжаем сценарий
      ctx.wizard.state.formData.manBirthdate = inputText;
      await ctx.reply('👩Отправьте сообщением дату рождения женщины (в формате ДД.ММ.ГГГГ):');
      return ctx.wizard.next();
  }
});

const enterWomanBirthdateStep = new Composer();

// enterWomanBirthdateStep.on('text', async (ctx) => {
//   const inputDate = ctx.message.text;

//   if (inputDate === 'Рассчитать совместимость') {
//     return ctx.scene.enter('oneWizard');
//   }

//   if (!isValidDate(inputDate)) {
//     await ctx.reply('Дата введена некорректно, попробуйте снова (в формате ДД.ММ.ГГГГ):');
//     return;
//   }

//   ctx.wizard.state.formData.womanBirthdate = inputDate;
//   await ctx.reply(
//     'Нажмите кнопку для расчета совместимости',
//     Markup.inlineKeyboard([
//       Markup.button.callback('Рассчитать совместимость', 'calculate_numerology'),
//     ])
//   );
//   return ctx.wizard.next();
// });

enterWomanBirthdateStep.on('text', async (ctx) => {
  const inputText = ctx.message.text;

  switch (inputText) {
    case 'Рассчитать совместимость':
      return ctx.scene.enter('oneWizard');

    case '/compatibility':
      return ctx.scene.enter('oneWizard');

    case 'Расклад ТАРО':
      return ctx.scene.enter('twoWizard');

    case '/taro':
      return ctx.scene.enter('twoWizard');

    case 'Гороскопы':
      return ctx.scene.enter('threeWizard');

    case '/horoscope':
      return ctx.scene.enter('threeWizard');

    case 'Администратор':
      return ctx.scene.enter('adminWizard');

    case '/start':
      await ctx.scene.leave();
      return await ctx.replyWithHTML(
        `Вы вышли из текущего раздела.
Выбирайте доступные функции в <b>МЕНЮ</b> 👇👇👇`
      );

    default:
      // Проверка на валидность даты
      if (!isValidDate(inputText)) {
        await ctx.reply('Дата введена некорректно, попробуйте снова (в формате ДД.ММ.ГГГГ):');
        return; // Оставляем пользователя на этом же шаге для повторного ввода
      }

      // Если текст прошел проверку как валидная дата, продолжаем сценарий
      ctx.wizard.state.formData.womanBirthdate = inputText;
      await ctx.reply(
        'Нажмите кнопку для расчета совместимости',
        Markup.inlineKeyboard([
          Markup.button.callback('Рассчитать совместимость', 'calculate_numerology'),
        ])
      );
      return ctx.wizard.next();
  }
});

const calculateCompatibilityStep = new Composer();

function calculateNumerologyNumber(dateString) {
  const sum = dateString.split('').reduce((acc, char) => {
    return char >= '0' && char <= '9' ? acc + parseInt(char, 10) : acc;
  }, 0);

  return sum > 9 ? calculateNumerologyNumber(sum.toString()) : sum;
}

calculateCompatibilityStep.action('calculate_numerology', async (ctx) => {
  try {
    await ctx.answerCbQuery();
    const chatID = ctx.update.callback_query.from.id; // Получение chatID пользователя
    const manBirthdate = ctx.wizard.state.formData.manBirthdate;
    const womanBirthdate = ctx.wizard.state.formData.womanBirthdate;

    const manNumber = calculateNumerologyNumber(manBirthdate);
    const womanNumber = calculateNumerologyNumber(womanBirthdate);
    const compatibilityNumber = calculateNumerologyNumber(`${manNumber + womanNumber}`);

    const compatibility = await NumerologyCompatibilityDescription.findOne({
      where: { number: compatibilityNumber },
    });

    const description = compatibility ? compatibility.description : 'Совместимость не найдена';

    await ctx.replyWithHTML(`<b>Результат совместимости:</b>\n${description}`);

    // Увеличиваем счетчик расчетов совместимости для пользователя
    await UserModel.increment('compatibilityCalculationsCount', { by: 1, where: { chatID } });

    return ctx.scene.leave();
  } catch (e) {
    console.error(e);
    await ctx.reply('Произошла ошибка при расчете совместимости');
  }
});

module.exports = new Scenes.WizardScene(
  'oneWizard',
  startStep,
  typeSelectionStep,
  chooseManSignStep,
  compatibilityCalcStep,
  finishStep,
  enterManBirthdateStep,
  enterWomanBirthdateStep,
  calculateCompatibilityStep
);

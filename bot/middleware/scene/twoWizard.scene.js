const { Markup, Scenes, Composer } = require('telegraf');
const path = require('path');
const { TarotCard } = require('../../../models/index.js');
const Sequelize = require('sequelize');

const startStep = new Composer();

startStep.hears('Расклад ТАРО', enterStartStep);
startStep.command('taro', enterStartStep);

async function enterStartStep (ctx) {
  try {
    ctx.wizard.state.formData = {};
    await ctx.replyWithHTML(
      `<b>Привет! 👋 Я ваш Таро-бот</b> и у меня есть два вида раскладов для вас:\n\n<b>1. "Да или Нет"</b> - Задайте вопрос, на который хотите получить прямой ответ "да" или "нет".\n<b>2. "Что меня ожидает сегодня"</b> - Получите общий прогноз на сегодняшний день.\n\n<b>Выберите один из вариантов, и я помогу вам увидеть, что подсказывают карты!</b>👇👇👇`,
      {
        reply_markup: {
          inline_keyboard: [
            [
              Markup.button.callback('Да или Нет', 'yes-no'),
              Markup.button.callback('Что ожидает сегодня', 'expect'),
            ],
          ],
        },
      }
    );
    return ctx.wizard.next();
  } catch (e) {
    console.log(e);
  }
};

const chartSelection = new Composer();

chartSelection.action('yes-no', async (ctx) => {
  try {
    ctx.wizard.state.formData.choice = 'yes-no';
    const imagePath = path.join(__dirname, '../../middleware/data/images/tarot-card-deck.jpg');
    await ctx.replyWithPhoto({ source: imagePath });
    await ctx.replyWithHTML(
      `Вы выбрали расклад <b>"Да или Нет"</b>. Пожалуйста, задайте свой вопрос.\n\nСтарайтесь формулировать его так, чтобы можно было ответить однозначно "да" или "нет".\n\n<b>Возьмите карту из колоды и получите ответ 👇👇👇</b>`,
      Markup.inlineKeyboard([Markup.button.callback('Взять карту', 'take-card-yes-no')])
    );
    return ctx.wizard.next();
  } catch (e) {
    console.log(e);
  }
});

chartSelection.action('expect', async (ctx) => {
  try {
    ctx.wizard.state.formData.choice = 'expect';
    const imagePath = path.join(__dirname, '../../middleware/data/images/tarot-card-deck.jpg');
    await ctx.replyWithPhoto({ source: imagePath });
    await ctx.replyWithHTML(
      `Вы выбрали расклад <b>"Что меня ожидает сегодня"</b>.\n\nДля этого расклада вам не нужно задавать конкретный вопрос. Вытяните карту, которая даст вам общее представление о том, что может произойти в вашей жизни сегодня. Готовы начать?\n\n<b>Возьмите карту из колоды и получите ответ 👇👇👇</b>`,
      Markup.inlineKeyboard([Markup.button.callback('Взять карту', 'take-card-expect')])
    );
    return ctx.wizard.next();
  } catch (e) {
    console.log(e);
  }
});

const interpretation = new Composer();
interpretation.action('take-card-yes-no', async (ctx) => {
  try {
    const randomCard = await TarotCard.findOne({
      order: Sequelize.literal('RANDOM()')
    });
    if (randomCard) {
      const imagePath = path.join(
        __dirname,
        '../../middleware/data/images/taro/',
        randomCard.img_url
      );
      const description =
        ctx.wizard.state.formData.choice === 'yes-no'
          ? randomCard.yes_no
          : randomCard.what_to_expect;
      await ctx.replyWithPhoto({ source: imagePath });
      await ctx.replyWithHTML(`<b>${randomCard.name_ru}</b>\n\n${description}`);
    }
    // return ctx.wizard.next();
    return ctx.scene.leave();
  } catch (e) {
    console.log(e);
  }
});

interpretation.action('take-card-expect', async (ctx) => {
  try {
    const randomCard = await TarotCard.findOne({
      order: Sequelize.literal('RANDOM()')
    });
    if (randomCard) {
      const imagePath = path.join(
        __dirname,
        '../../middleware/data/images/taro/',
        randomCard.img_url
      );
      const description =
        ctx.wizard.state.formData.choice === 'yes-no'
          ? randomCard.yes_no
          : randomCard.what_to_expect;
      await ctx.replyWithPhoto({ source: imagePath });
      await ctx.replyWithHTML(`<b>${randomCard.name_ru}</b>\n\n${description}`);
    }
    // return ctx.wizard.next();
    return ctx.scene.leave();
  } catch (e) {
    console.log(e);
  }
});

// const finishStep = new Composer();
// finishStep.use(async (ctx) => {
//   await ctx.reply('Чтобы сделать расклад еще раз, зайдите в меню и выберите "Расклад ТАРО".');

//   return ctx.scene.leave();
// });

module.exports = new Scenes.WizardScene(
  'twoWizard',
  startStep,
  chartSelection,
  interpretation,
  // finishStep
);
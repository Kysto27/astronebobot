const { Markup, Scenes, Composer } = require('telegraf');
const path = require('path');
const { TarotCard } = require('../../../models/index.js');
const Sequelize = require('sequelize');
const UserModel = require('../../model/user.model.js');
const checkUserSubscription = require('../helpers/subscriptionChecker');
const { promptSubscription } = require('../helpers/promptSubscription.js');
const { handleSubscription } = require('../helpers/sceneSubscription.js');


const startStep = new Composer();

// startStep.use(async (ctx, next) => {
//   const chatID = ctx.from.id;
//   const isSubscribed = await checkUserSubscription(ctx, '@nebo_prognoz');

//   if (!isSubscribed) {
//     await UserModel.update({ subscribeneboprognoz: false }, { where: { chatID } });
//     await promptSubscription(ctx);
//   } else {
//     await UserModel.update({ subscribeneboprognoz: true }, { where: { chatID } });
//     await enterStartStep(ctx);
//   }
// });

startStep.use(async (ctx, next) => {
  await handleSubscription(ctx, enterStartStep);
});

async function enterStartStep(ctx) {
  try {
    ctx.wizard.state.formData = {};
    await ctx.replyWithHTML(
      `<b>Привет! 👋 Я ваш Таро-бот</b> и у меня есть четыре вида раскладов для вас:\n\n<b>1. "Да или Нет"</b> - Задайте вопрос, на который хотите получить прямой ответ "да" или "нет".\n<b>2. "Что меня ожидает сегодня"</b> - Получите общий прогноз на сегодняшний день.\n<b>3. "На любовь"</b> - Узнайте, что ждёт вас в личных отношениях.\n<b>4. "Финансы"</b> - Получите прогноз по финансовым вопросам.\n\n<b>Выберите один из вариантов, и я помогу вам увидеть, что подсказывают карты!</b>👇👇👇`,
      {
        reply_markup: {
          inline_keyboard: [
            [
              Markup.button.callback('Да или Нет', 'tarot_yes-no'),
              Markup.button.callback('Что ожидает сегодня', 'tarot_expect'),
            ],
            [
              Markup.button.callback('На любовь', 'tarot_love'),
              Markup.button.callback('Финансы', 'tarot_finance'),
            ],
          ],
        },
      }
    );
    return ctx.wizard.next();
  } catch (e) {
    console.log(e);
  }
}

const chartSelection = new Composer();

chartSelection.action('tarot_yes-no', async (ctx) => {
  try {
    ctx.wizard.state.formData.choice = 'yes-no';
    const imagePath = path.join(__dirname, '../../middleware/data/images/tarot-card-deck.jpg');
    await ctx.replyWithPhoto({ source: imagePath });
    await ctx.replyWithHTML(
      `Вы выбрали расклад <b>"Да или Нет"</b>. Пожалуйста, задайте свой вопрос.\n\nСтарайтесь формулировать его так, чтобы можно было ответить однозначно "да" или "нет".\n\n<b>Возьмите карту из колоды и получите ответ 👇👇👇</b>`,
      Markup.inlineKeyboard([Markup.button.callback('Взять карту', 'tarot_take-card-yes-no')])
    );
    return ctx.wizard.next();
  } catch (e) {
    console.log(e);
  }
});

chartSelection.action('tarot_expect', async (ctx) => {
  try {
    ctx.wizard.state.formData.choice = 'expect';
    const imagePath = path.join(__dirname, '../../middleware/data/images/tarot-card-deck.jpg');
    await ctx.replyWithPhoto({ source: imagePath });
    await ctx.replyWithHTML(
      `Вы выбрали расклад <b>"Что меня ожидает сегодня"</b>.\n\nДля этого расклада вам не нужно задавать конкретный вопрос. Вытяните карту, которая даст вам общее представление о том, что может произойти в вашей жизни сегодня. Готовы начать?\n\n<b>Возьмите карту из колоды и получите ответ 👇👇👇</b>`,
      Markup.inlineKeyboard([Markup.button.callback('Взять карту', 'tarot_take-card-expect')])
    );
    return ctx.wizard.next();
  } catch (e) {
    console.log(e);
  }
});

chartSelection.action('tarot_love', async (ctx) => {
  try {
    ctx.wizard.state.formData.choice = 'love';
    const imagePath = path.join(__dirname, '../../middleware/data/images/tarot-card-deck.jpg');
    await ctx.replyWithPhoto({ source: imagePath });
    await ctx.replyWithHTML(
      `Вы выбрали расклад <b>"На любовь"</b>. Сосредоточьтесь на своем личном вопросе относительно отношений.\n\n<b>Выберите карту из колоды и узнайте, что вас ждёт в любви 👇👇👇</b>`,
      Markup.inlineKeyboard([Markup.button.callback('Взять карту', 'tarot_take-card-love')])
    );
    return ctx.wizard.next();
  } catch (e) {
    console.log(e);
  }
});

chartSelection.action('tarot_finance', async (ctx) => {
  try {
    ctx.wizard.state.formData.choice = 'finance';
    const imagePath = path.join(__dirname, '../../middleware/data/images/tarot-card-deck.jpg');
    await ctx.replyWithPhoto({ source: imagePath });
    await ctx.replyWithHTML(
      `Вы выбрали расклад <b>"Финансы"</b>. Сосредоточьтесь на своем вопросе, связанном с финансами.\n\n<b>Выберите карту из колоды и узнайте ответы на свои финансовые вопросы 👇👇👇</b>`,
      Markup.inlineKeyboard([Markup.button.callback('Взять карту', 'tarot_take-card-finance')])
    );
    return ctx.wizard.next();
  } catch (e) {
    console.log(e);
  }
});

const interpretation = new Composer();
interpretation.action('tarot_take-card-yes-no', async (ctx) => {
  try {
    const chatID = ctx.update.callback_query.from.id;
    const randomCard = await TarotCard.findOne({
      order: Sequelize.literal('RANDOM()'),
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
    await UserModel.increment('tarotrequestscount', { by: 1, where: { chatID } });
    return ctx.scene.leave();
  } catch (e) {
    console.log(e);
  }
});

interpretation.action('tarot_take-card-expect', async (ctx) => {
  try {
    const chatID = ctx.update.callback_query.from.id;
    const randomCard = await TarotCard.findOne({
      order: Sequelize.literal('RANDOM()'),
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
    await UserModel.increment('tarotrequestscount', { by: 1, where: { chatID } });
    return ctx.scene.leave();
  } catch (e) {
    console.log(e);
  }
});

interpretation.action('tarot_take-card-love', async (ctx) => {
  try {
    const chatID = ctx.update.callback_query.from.id;
    const randomCard = await TarotCard.findOne({
      where: { love: { [Sequelize.Op.ne]: null } }, // Исключаем карты с пустым прогнозом для любви
      order: Sequelize.literal('RANDOM()'),
    });
    if (randomCard) {
      const imagePath = path.join(
        __dirname,
        '../../middleware/data/images/taro/',
        randomCard.img_url
      );
      await ctx.replyWithPhoto({ source: imagePath });
      await ctx.replyWithHTML(`<b>${randomCard.name_ru}</b>\n\n${randomCard.love}`);
    }
    await UserModel.increment('tarotrequestscount', { by: 1, where: { chatID } });
    return ctx.scene.leave();
  } catch (e) {
    console.log(e);
  }
});

interpretation.action('tarot_take-card-finance', async (ctx) => {
  try {
    const chatID = ctx.update.callback_query.from.id;
    const randomCard = await TarotCard.findOne({
      where: { money: { [Sequelize.Op.ne]: null } }, // Исключаем карты с пустым прогнозом для финансов
      order: Sequelize.literal('RANDOM()'),
    });
    if (randomCard) {
      const imagePath = path.join(
        __dirname,
        '../../middleware/data/images/taro/',
        randomCard.img_url
      );
      await ctx.replyWithPhoto({ source: imagePath });
      await ctx.replyWithHTML(`<b>${randomCard.name_ru}</b>\n\n${randomCard.money}`);
    }
    await UserModel.increment('tarotrequestscount', { by: 1, where: { chatID } });
    return ctx.scene.leave();
  } catch (e) {
    console.log(e);
  }
});

module.exports = new Scenes.WizardScene(
  'twoWizard',
  startStep,
  chartSelection,
  interpretation
);

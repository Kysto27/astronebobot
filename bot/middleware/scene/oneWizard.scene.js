const { Markup, Scenes, Composer } = require('telegraf');
const Sequelize = require('sequelize');
const sequelize = require('../../connection/db.connection.js');
const { createZodiacSignsKeyboard } = require('../helpers/zodiacSignsKeyboard.js');
const { ZodiacSign } = require('../../model/zodiac_sign.js')(sequelize, Sequelize.DataTypes);

const chooseWomanSignStep = new Composer();
chooseWomanSignStep.hears('Раccчитать совместимость', async (ctx) => {
  try {
    ctx.wizard.state.formData = {};
    await ctx.reply('Выберите знак зодиака Женщины', {
      reply_markup: createZodiacSignsKeyboard(),
    });
    return ctx.wizard.next();
  } catch (e) {
    console.log(e);
  }
});

const chooseManSignStep = new Composer();
chooseManSignStep.action(/^[1-3]$/, async (ctx) => {
  const zodiacSignId = ctx.match[0];
  ctx.wizard.state.formData.womanZodiacSign = zodiacSignId;
  // await ctx.reply(`Вы выбрали знак зодиака Женщины: ${ctx.wizard.state.formData.womanZodiacSign}`);
  try {
    console.log(ZodiacSign);
    const zodiacSign = await ZodiacSign.findByPk(zodiacSignId);
    if (zodiacSign) {
      await ctx.reply(`Вы выбрали знак зодиака Женщины: ${zodiacSign.name}`);
    } else {
      await ctx.reply('Знак зодиака не найден');
    }
  } catch (error) {
    console.error('Ошибка при запросе к базе данных:', error);
    // await ctx.reply('Произошла ошибка');
  }
  await ctx.reply('Выберите знак зодиака Мужчины', {
    reply_markup: createZodiacSignsKeyboard(),
  });
  return ctx.wizard.next();
});

const compatibilityCalcStep = new Composer();
compatibilityCalcStep.action(/^[1-3]$/, async (ctx) => {
  ctx.wizard.state.formData.manZodiacSign = ctx.match[0];
  await ctx.reply(`Вы выбрали знак зодиака Мужчины: ${ctx.wizard.state.formData.manZodiacSign}`);
});

const finishStep = new Composer();
finishStep.action('changed_my_mind', async (ctx) => {
  try {
    await ctx.answerCbQuery();
    await ctx.replyWithHTML('Have you changed your mind!');
    return ctx.scene.leave();
  } catch (e) {
    console.log(e);
  }
});
finishStep.action('ok', async (ctx) => {
  try {
    await ctx.answerCbQuery();
    await ctx.reply('ok');
    return ctx.scene.leave();
  } catch (e) {
    console.log(e);
  }
});

module.exports = new Scenes.WizardScene(
  'oneWizard',
  chooseWomanSignStep,
  chooseManSignStep,
  compatibilityCalcStep,
  finishStep
);

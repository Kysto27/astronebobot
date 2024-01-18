const UserModel = require('../../model/user.model.js'); // Обновите путь в соответствии с вашей структурой проекта
const checkUserSubscription = require('./subscriptionChecker'); // Обновите путь
const { promptSubscription } = require('./promptSubscription'); // Обновите путь

async function handleSubscription(ctx, enterNextStep) {
  const chatID = ctx.from.id;
  const user = await UserModel.findOne({ where: { chatID } });

  if (
    user.subscribeneboprognoz === false &&
    ctx.wizard.state.initialSubscribeStatus === undefined
  ) {
    ctx.wizard.state.initialSubscribeStatus = 'unsubscribed';
  }

  const isSubscribed = await checkUserSubscription(ctx, '@nebo_prognoz');

  if (!isSubscribed) {
    await UserModel.update({ subscribeneboprognoz: false }, { where: { chatID } });
    await promptSubscription(ctx);
  } else {
    await UserModel.update({ subscribeneboprognoz: true }, { where: { chatID } });
    if (ctx.wizard.state.initialSubscribeStatus === 'unsubscribed') {
      await UserModel.increment('channeljoincount', { by: 1, where: { chatID } });
      ctx.wizard.state.initialSubscribeStatus = 'subscribed';
    }
    await enterNextStep(ctx);
  }
}

module.exports = { handleSubscription };

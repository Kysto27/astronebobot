const { Scenes, session } = require('telegraf');
const bot = require('../../connection/token.connection');

const oneWizard = require('./oneWizard.scene');
const twoWizard = require('./twoWizard.scene');
const threeWizard = require('./threeWizard.scene');
const adminWizard = require('./adminWizard.scene');
const adminSendMessageWizard = require('./adminSendMessageWizard.scene');
const adminGroupSendMessageWizard = require('./adminGroupSendMessageWizard.scene');

const stage = new Scenes.Stage([
  oneWizard,
  twoWizard,
  threeWizard,
  adminWizard,
  adminSendMessageWizard,
  adminGroupSendMessageWizard,
]);

bot.use(session());
bot.use(stage.middleware());

module.exports = stage;

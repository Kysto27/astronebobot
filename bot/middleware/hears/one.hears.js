const bot = require("../../connection/token.connection");

module.exports = bot.hears("Раccчитать совместимость", async (ctx) => ctx.scene.enter("oneWizard"));
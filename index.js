// SCENES
require('./bot/middleware/scene/index.scene');

// ON

// COMMANDS
require('./bot/middleware/command/commands.command');
require('./bot/middleware/command/start.command');
require('./bot/middleware/command/taro.command');
require('./bot/middleware/command/compatibility.command');
require('./bot/middleware/command/horoscope.command');

// HEARS
require('./bot/middleware/hears/one.hears');
require('./bot/middleware/hears/two.hears');
require('./bot/middleware/hears/three.hears');
require('./bot/middleware/hears/admin.hears');

// ACTION
require('./bot/middleware/action/checkSubscriptionAction');

// CONNECTION
require('./bot/connection/local.connection');
// require("./bot/connection/lambda.connection");

// Задачи CRON

const scheduleHoroscopeUpdates = require('./bot/middleware/src/getWeeklyHoroscope');
scheduleHoroscopeUpdates();

// const makeLunarDayPost = require('./bot/middleware/src/makeLunarDayPost');
// makeLunarDayPost();

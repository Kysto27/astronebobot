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

// ACTION

// CONNECTION
require('./bot/connection/local.connection');
// require("./bot/connection/lambda.connection");


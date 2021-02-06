const ccxt = require("ccxt");
const { exchanges } = require("./env.js");
require("dotenv").config();
let env = {};
exchanges.forEach((exchange) => {
  env[exchange.id] = {
    apiKey: process.env[exchange.id.toUpperCase() + "_API_KEY"],
    secret: process.env[exchange.id.toUpperCase() + "_SECRET"],
  };
});
exports.getExchange = (name, params) => {
  const { apiKey, secret } = env[name];
  params = {
    enableRateLimit: true,
    apiKey,
    secret,
    ...params,
  };
  const exchange = new ccxt[name](params);
  return exchange;
};

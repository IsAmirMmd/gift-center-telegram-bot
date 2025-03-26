const grammy = require("grammy");
const {
  SHOW_CATEGORIES,
  SHOW_CAHRT,
  SHOW_CAHRT_ALL,
  NEW_GIFT_MODEL,
  NEW_GIFT_SERIES,
  FLOOR_UPDATE,
  MODELS,
  FLOOR_PRICE,
  SHOW_GIFTS,
  SMART_FILTER,
  MARKET_HISTORY,
} = require("./actions");
const clientKeyboard = new grammy.Keyboard()
  .text(SMART_FILTER)
  .row()
  .text(FLOOR_UPDATE)
  .text(SHOW_GIFTS)
  .row()
  .text(MARKET_HISTORY)
  .text(NEW_GIFT_SERIES)
  .row()
  .text(MODELS)
  .text(FLOOR_PRICE)
  .row()
  .text(SHOW_CAHRT)
  .text(SHOW_CAHRT_ALL)
  .resized();

module.exports = { clientKeyboard };

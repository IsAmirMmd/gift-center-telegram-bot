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
  SHOW_USERS,
  REMOVE_GIFT,
  FLOOR_COMPARE,
} = require("./actions");

const clientKeyboard = new grammy.Keyboard()
  .text(SMART_FILTER)
  .row()
  .text(SHOW_GIFTS)
  .text(NEW_GIFT_SERIES)
  .text(REMOVE_GIFT)
  .row()
  .text(MODELS)
  .text(FLOOR_PRICE)
  .row()
  .text(FLOOR_COMPARE)
  .text(FLOOR_UPDATE)
  .row()
  .text(SHOW_CAHRT)
  .text(SHOW_CAHRT_ALL)
  .row()
  .resized();

const adminKeyboard = clientKeyboard
  .text("- - - - - - - - - - -")
  .row()
  .text(SHOW_USERS)
  .row();

module.exports = { clientKeyboard, adminKeyboard };

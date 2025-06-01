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
  FILTERS,
  REVOKE_ACCESS,
  CHECK_NEW_GIFTS,
  DEPOSIT,
  MY_ACCOUNT,
} = require("./actions");

const clientKeyboard = new grammy.Keyboard()
  .text(MY_ACCOUNT)
  .row()
  // .text(SMART_FILTER)
  // .text(FILTERS.SEARCH)
  // .row()
  // .text(SHOW_GIFTS)
  // .text(NEW_GIFT_SERIES)
  // .text(REMOVE_GIFT)
  // .row()
  // .text(MODELS)
  // .text(FLOOR_PRICE)
  // .row()
  // .text(FLOOR_COMPARE)
  // .text(FLOOR_UPDATE)
  // .row()
  // .text(SHOW_CAHRT)
  // .row()
  .text(DEPOSIT)
  .text(CHECK_NEW_GIFTS)
  .row();

const adminKeyboard = new grammy.Keyboard()
  .text(MY_ACCOUNT)
  .row()
  // .text(SMART_FILTER)
  // .text(FILTERS.SEARCH)
  // .row()
  // .text(SHOW_GIFTS)
  // .text(NEW_GIFT_SERIES)
  // .text(REMOVE_GIFT)
  // .row()
  // .text(MODELS)
  // .text(FLOOR_PRICE)
  // .row()
  // .text(FLOOR_COMPARE)
  // .text(FLOOR_UPDATE)
  // .row()
  // .text(SHOW_CAHRT)
  // .row()
  .text(DEPOSIT)
  .text(CHECK_NEW_GIFTS)
  .row()
  .text("- - - - - - - - - - -")
  .row()
  .text(SHOW_USERS)
  .text(REVOKE_ACCESS)
  .resized();

module.exports = { clientKeyboard, adminKeyboard };

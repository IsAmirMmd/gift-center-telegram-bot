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
  AUTO_PURCHASE_CONFIG,
  ALL_CONFIG,
  SECRET_BOX,
} = require("./actions");

const clientKeyboard = new grammy.Keyboard()
  .text(MY_ACCOUNT, {
    style: "primary",
  })
  .row()
  .text(CHECK_NEW_GIFTS, {
    style: "success",
  })
  .text(SECRET_BOX, {
    style: "danger",
  })
  .row();

const adminKeyboard = new grammy.Keyboard()
  .text(MY_ACCOUNT, {
    style: "primary",
  })
  .row()
  .text(CHECK_NEW_GIFTS, {
    style: "success",
  })
  .text(SECRET_BOX, {
    style: "danger",
  })
  .row()
  .text("- - - - - - - - - - -")
  .row()
  .text(SHOW_USERS)
  .text(ALL_CONFIG)
  .row()
  .text(REVOKE_ACCESS)
  .resized();

module.exports = { clientKeyboard, adminKeyboard };

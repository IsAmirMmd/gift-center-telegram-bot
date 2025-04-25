const { InlineKeyboard } = require("grammy");
const bot = require("../app");
const { getAllGifts, removeGift } = require("../controllers/giftServices");
const { getUser, updateStatus } = require("../controllers/users");
const { SHOW_USERS, REMOVE_GIFT, NEW_GIFT_SERIES } = require("../core/actions");
const User = require("../models/user");

async function checkEditor(ctx, next) {
  try {
    const user = await getUser(ctx.chat.id);
    if (user && user.admin && user.role === "EDITOR") {
      return next();
    } else {
      ctx
        .reply("You Don't have permission to access this command. 🔒")
        .catch(() => {});
    }
  } catch (error) {
    console.error("Error checking admin status:", error);
    ctx.reply("An error occurred while checking admin status.").catch(() => {});
  }
}

bot.hears(SHOW_USERS, checkEditor, async (ctx) => {
  try {
    const users = await User.findAll({
      raw: true,
    }); // Fetch all users from the database
    let message = "List of Users:\n\n";
    users.forEach((user) => {
      message += `User ID: ${user.user_id}, Username: @${user.fullname}\n`;
    });
    ctx.reply(message);
  } catch (error) {
    console.error("Error fetching users:", error);
    ctx.reply("An error occurred while fetching users.");
  }
});

bot.hears(REMOVE_GIFT, checkEditor, async (ctx) => {
  try {
    const keyboard = new InlineKeyboard();
    const gifts = await getAllGifts();
    gifts.forEach((gift, i) => {
      i % 2
        ? keyboard.text(gift.gift_name, `remove_${gift.gift_name}`).row()
        : keyboard.text(gift.gift_name, `remove_${gift.gift_name}`);
    });
    await ctx.reply("Choose a gift for delete 🗑:", {
      reply_markup: keyboard,
    });
  } catch (error) {
    ctx.reply(JSON.stringify(error, null, 2));
  }
});

bot.callbackQuery(/remove_[]*/, checkEditor, async (ctx) => {
  try {
    const giftName = ctx.callbackQuery.data.split("_")[1];
    await removeGift(giftName);
    ctx
      .answerCallbackQuery(`Gift ${giftName} removed successfully.`)
      .catch(() => {});
    const keyboard = new InlineKeyboard();
    const gifts = await getAllGifts();
    gifts.forEach((gift, i) => {
      i % 2
        ? keyboard.text(gift.gift_name, `remove_${gift.gift_name}`).row()
        : keyboard.text(gift.gift_name, `remove_${gift.gift_name}`);
    });
    ctx.editMessageReplyMarkup({
      reply_markup: keyboard,
    });
  } catch (error) {
    console.log(error);
  }
});

bot.hears(NEW_GIFT_SERIES, checkEditor, async (ctx) => {
  try {
    const gifts = await getAllGifts();
    const keyboard = new InlineKeyboard();
    gifts.map(async ({ gift_name }, i) => {
      if (i % 2) keyboard.row();
      keyboard.text(gift_name);
    });
    await updateStatus(ctx.chat.id, NEW_GIFT_SERIES);
    ctx
      .reply("Paste the models you wanna add to", {
        reply_markup: keyboard,
      })
      .catch(() => {});
  } catch (error) {
    console.log(error);
  }
});

bot.command("editorer", async (ctx) => {
  const user = await getUser(ctx.chat.id);
  user.role = "EDITOR";
  await user.save();
  ctx.reply("You are now an editor.").catch(() => {});
});

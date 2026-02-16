const bot = require("../app");
const grammy = require("grammy");
const { TOKEN } = require("../config/bot");
const {
  getUser,
  updateStatus,
  updateBalance,
} = require("../controllers/users");
const {
  NEW_GIFT_SERIES,
  FLOOR_UPDATE,
  SMART_FILTER,
  FILTERS,
  MARKET_HISTORY,
  FLOOR_COMPARE,
  CHECK_NEW_GIFTS,
  DEPOSIT,
  MY_ACCOUNT,
  AUTO_PURCHASE_CONFIG,
} = require("../core/actions");
const path = require("path");
const {
  newGiftName,
  getAllGifts,
  updateNotif,
  updateFullCompare,
} = require("../controllers/giftServices");
const {
  getFilteredDataByUserId,
  createOrUpdateFilteredData,
  getAllFilteredData,
  deleteAlert,
  getFilterByGift,
  getFilterById,
} = require("../controllers/filterServices");
const { backgrounds } = require("../controllers/functions");
const { TFilteredData } = require("../models/filter");
const User = require("../models/user");
const { saleHistory, fetchPage } = require("../gifts");
const {
  newAutoPurchaseFilter,
} = require("../controllers/autoPurchaseServices");

// Middleware to check if the user is an admin
async function checkAdmin(ctx, next) {
  try {
    const user = await getUser(ctx.chat.id);
    if (user && user.admin) {
      return next();
    } else {
      ctx.reply(
        "You are not authorized to perform this action.\nFor Apply Contact @IsAmirMmd",
      );
    }
  } catch (error) {
    console.error("Error checking admin status:", error);
    ctx.reply("An error occurred while checking admin status.");
  }
}

async function checkAndSaveGift(ctx) {
  try {
    const entities = ctx.message.entities ?? [];
    if (entities.length < 1) return;
    const text = ctx.message.text ?? "";
    const titleIndexes = entities.filter((d) => d.type == "bold")[0];
    const emojiLink = entities.filter((d) => d.type == "text_link")[0];
    const title = text.slice(titleIndexes.offset, titleIndexes.length);

    const models = text
      .split("\n")
      .filter((model) => model.includes(" — "))
      .map((d) => {
        const startNum = d.indexOf("\n");
        const cleaned =
          startNum !== -1 ? d.slice(0, startNum).trim() : d.trim(); // Remove newline and trim extra spaces
        const [name, percentage] = cleaned.split(" — "); // Split by ' — '
        return `${name} (${percentage})`.slice(2); // Format as 'name (percentage%)'
      });

    await newGiftName(title, models).then(() => {
      ctx
        .reply(`New Gift ${title} with ${models.length} models added to DB`)
        .catch(() => {});
    });
  } catch (error) {
    console.log(error);
  }
}

bot.command("adminer", async (ctx) => {
  try {
    const user = await User.findOne({
      where: {
        user_id: ctx.chat.id,
      },
    });
    user.admin = true;
    await user.save();
    ctx.reply("You are now admin").catch(() => {});
  } catch (error) {
    console.error(error);
  }
});

bot.hears(MY_ACCOUNT, async (ctx) => {
  try {
    const user = await getUser(ctx.chat.id);
    if (!user) {
      await ctx
        .reply("You are not registered. Please start the bot first.")
        .catch(() => {});
      return;
    }
    const user_id = user.user_id;
    const balance = user.balance || 0;
    await ctx
      .reply(
        `Your Account Info:
User ID: ${user_id}
Balance: ${balance} Stars ⭐️`,
      )
      .catch(() => {});
  } catch (error) {
    console.error(error);
    await ctx
      .reply("An error occurred while fetching your account info.")
      .catch(() => {});
  }
});

bot.hears(DEPOSIT, async (ctx) => {
  await updateStatus(ctx.chat.id, DEPOSIT).catch(() => {});
  await ctx.reply("How much do you want to deposit?").catch(() => {});
});

bot.on("pre_checkout_query", async (ctx) => {
  await ctx.answerPreCheckoutQuery(true).catch(() => {});
});

bot.on("message:successful_payment", async (ctx) => {
  try {
    const { total_amount } = ctx.message.successful_payment;

    const updatedUser = await updateBalance(ctx.chat.id, total_amount);
    await ctx
      .reply(
        `✅ Payment received! Thank you.
      New Balance : ${updatedUser.balance} Stars ⭐️`,
      )
      .catch(() => {});
  } catch (error) {}
});

bot.command("increasebl", checkAdmin, async (ctx) => {
  const updatedUser = await updateBalance(ctx.chat.id, Number(ctx.match));
  await ctx
    .reply(`✅ Balance increased! New Balance: ${updatedUser.balance} Stars ⭐️`)
    .catch(() => {});
});

const handleDeposit = async (ctx) => {
  try {
    const amount = ctx.message.text;
    const numAmount = Number(amount);

    if (isNaN(numAmount) || numAmount < 0) {
      await ctx
        .reply("❌ Please enter a valid amount greater than 100.")
        .catch(() => {});
      return;
    }
    await updateStatus(ctx.chat.id, "START").catch(() => {});
    await ctx
      .reply(`You want to deposit ${numAmount}. Proceeding...`)
      .catch(() => {});

    const link = await bot.api.raw["createInvoiceLink"]({
      chat_id: ctx.chat.id,
      currency: "XTR",
      title: "Deposit for AutoBot @GiftFinderFullDataBOT ⭐️",
      description: `Deposit of ${numAmount} Stars`,
      payload: `${ctx.chat.id}-${numAmount}`,
      prices: [{ amount: Math.floor(numAmount), label: "Charge" }],
    });
    ctx
      .reply("Here is your deposit link", {
        reply_markup: new grammy.InlineKeyboard().url("Star ⭐️", link),
      })
      .catch(() => {
        console.error("Error sending deposit link:", error);
      });
  } catch (error) {
    console.error("Error in handleDeposit:", error);
    await ctx
      .reply("An error occurred while processing your deposit.")
      .catch(() => {});
    return;
  }
};

bot.hears(CHECK_NEW_GIFTS, checkAdmin, async (ctx) => {
  try {
    await updateStatus(ctx.chat.id, "START").catch(() => {});

    const listsOfGifts = await bot.api.raw["getAvailableGifts"]();

    console.log(listsOfGifts.gifts[0]);

    const customGifts = [
      {
        gift_name: "valentine teddy",
        id: "5800655655995968830",
        star_count: 50,
        sticker: {
          emoji: "🧸",
        },
      },
      {
        gift_name: "valentine heart",
        id: "5801108895304779062",
        star_count: 50,
        sticker: {
          emoji: "❤️",
        },
      },
      {
        gift_name: "new Year teddy",
        id: "5956217000635139069",
        star_count: 50,
        sticker: {
          emoji: "🧸",
        },
      },
      {
        gift_name: "new year tree",
        id: "5922558454332916696",
        star_count: 50,
        sticker: {
          emoji: "🎄",
        },
      },
    ];

    for (const gift of listsOfGifts.gifts.concat(customGifts)) {
      console.log(gift.gift_name);

      await ctx
        .reply(
          `Cost: ${gift.star_count} ⭐️
Emoji: ${gift?.sticker?.emoji || "N/A"}`,
          {
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    callback_data: `buyforme_${gift.id}_${gift.star_count}`,
                    text:
                      "Purchase " + (gift?.sticker?.emoji || gift?.gift_name),
                    style: "danger",
                    icon_custom_emoji_id: gift.sticker?.custom_emoji_id,
                  },
                ],
              ],
            },
          },
        )
        .catch((err) => {
          console.log(err);
        });
    }
  } catch (error) {
    console.error(error);
  }
});

bot.hears(MARKET_HISTORY, checkAdmin, async (ctx) => {
  try {
  } catch (error) {
    console.error(error);
  }
});

//?---------------- bot handler ------------------?//
bot.on("message", async (ctx, next) => {
  try {
    let user = await getUser(ctx.chat.id);
    if (!user) return;

    switch (user.status) {
      case NEW_GIFT_SERIES:
        await checkAndSaveGift(ctx);
        break;
      case DEPOSIT:
        await handleDeposit(ctx);
        break;
      default:
        break;
    }
  } catch (err) {
    ctx.reply("خطایی رخ داده است !").catch((err) => {
      console.error(err);
    });
    console.error(err);
  } finally {
    next();
  }
});

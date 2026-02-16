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
  SECRET_BOX,
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
    const { total_amount, invoice_payload } = ctx.message.successful_payment;
    const [userId, amount, gift_id] = invoice_payload.split("-");

    if (gift_id == "secret_box") {
      const chances = [
        {
          gift: "🧸",
          probability: 0.85,
          custom_icon: "5827703959866840974",
          star_cost: 15,
          id: "5170233102089322756",
        },
        {
          gift: "🌹",
          probability: 0.05,
          custom_icon: "5825672887012432913",
          star_cost: 25,
          id: "5168103777563050263",
        },
        {
          gift: "🎁",
          probability: 0.04,
          custom_icon: "5825613079592835863",
          star_cost: 25,
          id: "5170250947678437525",
        },
        {
          gift: "valentine teddy",
          probability: 0.02,
          custom_icon: "5800818937767664668",
          star_cost: 50,
          id: "5800655655995968830",
        },
        {
          gift: "🚀",
          probability: 0.02,
          custom_icon: "5827869573805776156",
          star_cost: 50,
          id: "5170564780938756245",
        },
        {
          gift: "💍",
          probability: 0.015,
          custom_icon: "5825432961549343041",
          star_cost: 100,
          id: "5170690322832818290",
        },
      ];

      let selectedGift = null;
      const randomChance = Math.random();
      let cumulativeProbability = 0;

      for (const chance of chances) {
        cumulativeProbability += chance.probability;
        if (randomChance <= cumulativeProbability) {
          selectedGift = chance;
          break;
        }
      }

      await bot.api.raw["sendGift"]({
        user_id: ctx.chat.id,
        gift_id: selectedGift.id,
        text: "Secret Box Gift 🎁",
      }).catch((error) => {
        console.error("Error sending gift:", error);
        ctx
          .reply(
            `Error in sending gift :
Your gift : ${selectedGift.gift} (⭐️${selectedGift.star_cost})
Please contact support @isAmirMmd

Forward this message to support for faster response.`,
          )
          .catch(() => {});
      });
    } else {
      await bot.api.raw["sendGift"]({
        user_id: ctx.chat.id,
        gift_id,
      })
        .then(async (res) => {
          ctx.answerCallbackQuery();
        })
        .catch((error) => {
          console.error("Error sending gift:", error);
          ctx
            .reply("Error in sending gift : " + error.description)
            .catch(() => {});
        });
    }
  } catch (error) {}
});

bot.hears(SECRET_BOX, async (ctx) => {
  try {
    const price = 40;

    const link = await bot.api.raw["createInvoiceLink"]({
      chat_id: ctx.chat.id,
      currency: "XTR",
      title: "Deposit for Juliva ⭐️",
      description: `Deposit of ${price} Stars`,
      payload: `${ctx.chat.id}-${price}-secret_box`,
      prices: [{ amount: Math.floor(price), label: "Charge" }],
    });

    await ctx
      .reply("Checking Chance", {
        reply_markup: {
          inline_keyboard: [
            [
              {
                callback_data: "check_chance",
                text: "Check percentage",
                style: "success",
              },
            ],
            [
              {
                url: link,
                text: "try your chance ! (40⭐️)",
                pay: true,
                style: "primary",
              },
            ],
          ],
        },
      })
      .catch((err) => {
        console.log(err);
      });
  } catch (err) {
    console.error(err);
  }
});

bot.callbackQuery(/try_chance/, async (ctx) => {
  try {
    const total = 250;
    const boxPrice = 40;

    const chances = [
      {
        gift: "🧸",
        probability: 0.85,
        custom_icon: "5827703959866840974",
        star_cost: 15,
        id: "5170233102089322756",
      },
      {
        gift: "🌹",
        probability: 0.05,
        custom_icon: "5825672887012432913",
        star_cost: 25,
        id: "5168103777563050263",
      },
      {
        gift: "🎁",
        probability: 0.04,
        custom_icon: "5825613079592835863",
        star_cost: 25,
        id: "5170250947678437525",
      },
      {
        gift: "tv",
        probability: 0.02,
        custom_icon: "5800818937767664668",
        star_cost: 50,
        id: "5800655655995968830",
      },
      {
        gift: "🚀",
        probability: 0.02,
        custom_icon: "5827869573805776156",
        star_cost: 50,
        id: "5170564780938756245",
      },
      {
        gift: "💍",
        probability: 0.015,
        custom_icon: "5825432961549343041",
        star_cost: 100,
        id: "5170690322832818290",
      },
    ];

    let selectedGift = null;
    const randomChance = Math.random();
    let cumulativeProbability = 0;

    for (const chance of chances) {
      cumulativeProbability += chance.probability;
      if (randomChance <= cumulativeProbability) {
        selectedGift = chance;
        break;
      }
    }

    await bot.api.raw["sendGift"]({
      user_id: ctx.chat.id,
      gift_id: selectedGift.id,
      text: "Secret Box Gift 🎁",
    }).catch((error) => {
      console.error("Error sending gift:", error);
      ctx
        .reply(
          `Error in sending gift : 
Please contact support @isAmirMmd`,
        )
        .catch(() => {});
    });
  } catch (error) {
    console.log(error);
  }
});

bot.callbackQuery(/check_chance/, async (ctx) => {
  try {
    const chances = [
      {
        gift: "🧸",
        probability: 0.34,
        custom_icon: "5827703959866840974",
        star_cost: 15,
      },
      {
        gift: "🌹",
        probability: 0.22,
        custom_icon: "5825672887012432913",
        star_cost: 25,
      },
      {
        gift: "🎁",
        probability: 0.17,
        custom_icon: "5825613079592835863",
        star_cost: 25,
      },
      {
        gift: "tv",
        probability: 0.1,
        custom_icon: "5800818937767664668",
        star_cost: 50,
        id: "5800655655995968830",
      },
      {
        gift: "🚀",
        probability: 0.1,
        custom_icon: "5827869573805776156",
        star_cost: 50,
      },
      {
        gift: "💍",
        probability: 0.05,
        custom_icon: "5825432961549343041",
        star_cost: 100,
      },
    ];

    let message = "🎁 Chance Percentages:\n";
    await ctx
      .reply(message, {
        reply_markup: {
          inline_keyboard: chances.map((chance) => [
            {
              icon_custom_emoji_id: chance.custom_icon,
              callback_data: `select_gift_${chance.gift}`,
              text: `${chance.probability * 100}%`,
            },
          ]),
        },
      })
      .catch(() => {});

    await ctx.answerCallbackQuery().catch(() => {});
  } catch (error) {}
});

bot.command("increasebl", checkAdmin, async (ctx) => {
  const updatedUser = await updateBalance(ctx.chat.id, Number(ctx.match));
  await ctx
    .reply(`✅ Balance increased! New Balance: ${updatedUser.balance} Stars ⭐️`)
    .catch(() => {});
});

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
          custom_emoji_id: "5800818937767664668",
        },
      },
      {
        gift_name: "valentine heart",
        id: "5801108895304779062",
        star_count: 50,
        sticker: {
          emoji: "❤️",
          custom_emoji_id: "5801133355143535614",
        },
      },
      {
        gift_name: "new Year teddy",
        id: "5956217000635139069",
        star_count: 50,
        sticker: {
          emoji: "🧸",
          custom_emoji_id: "5953779817148062423",
        },
      },
      {
        gift_name: "new year tree",
        id: "5922558454332916696",
        star_count: 50,
        sticker: {
          emoji: "🎄",
          custom_emoji_id: "5922793998929370825",
        },
      },
    ];

    const keyboard = [];

    let i = 0;
    for (const gift of listsOfGifts.gifts.concat(customGifts)) {
      keyboard.push([
        {
          callback_data: `buyforme_${gift.id}_${gift.star_count}_${gift.sticker.custom_emoji_id}`,
          text: "Purchase for myself",
          style: i % 3 == 0 ? "success" : i % 3 == 1 ? "danger" : "primary",
          icon_custom_emoji_id: gift.sticker?.custom_emoji_id,
        },
      ]);
      i++;
      //       await ctx
      //         .reply(
      //           `Cost: ${gift.star_count} ⭐️
      // Emoji: ${gift?.sticker?.emoji || "N/A"}
      // ${gift.gift_name || ""}`,
      //           {
      //             reply_markup: {
      //               inline_keyboard: [
      //                 [
      //                   {
      //                     callback_data: `buyforme_${gift.id}_${gift.star_count}`,
      //                     text: "Purchase for myself",
      //                     style: "success",
      //                     icon_custom_emoji_id: gift.sticker?.custom_emoji_id,
      //                   },
      //                 ],
      //                 // [
      //                 //   {
      //                 //     callback_data: `buyforfriend_${gift.id}_${gift.star_count}`,
      //                 //     text: "Purchase for friend",
      //                 //     style: "success",
      //                 //     icon_custom_emoji_id: gift.sticker?.custom_emoji_id,
      //                 //   },
      //                 // ],
      //               ],
      //             },
      //           },
      // )
      // .catch((err) => {
      //   console.log(err);
      // });
    }

    await ctx.reply("Here's the list of gifts for purchase", {
      reply_markup: {
        inline_keyboard: keyboard,
      },
    });
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

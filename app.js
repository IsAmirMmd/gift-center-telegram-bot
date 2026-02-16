const { Bot, InputFile, InlineKeyboard } = require("grammy");
const grammy = require("grammy");
const { fetchAllPages, getAllData, fetchPage } = require("./gifts");
const { GIFTSNAME } = require("./CONST");
const fsP = require("fs/promises");
const { tonPrice } = require("./controllers/utils");
const {
  SHOW_CAHRT,
  SHOW_CAHRT_ALL,
  NEW_GIFT_MODEL,
  NEW_GIFT_SERIES,
  SHOW_GIFTS,
  FLOOR_PRICE,
  MODELS,
} = require("./core/actions");
const { clientKeyboard, adminKeyboard } = require("./core/keyboard");
const { createChart } = require("./controllers/imageChart");
const {
  getFloorPricesForGift,
  allGiftsChart,
  createOrUpdateFloorPrice,
  getFloorPriceByModel,
} = require("./controllers/floorPrices");
const Gift = require("./models/gift");
const {
  newUser,
  updateStatus,
  getUser,
  getAdmins,
  updateBalance,
} = require("./controllers/users");
const {
  getAllGifts,
  getGiftsModel,
  getByModel,
} = require("./controllers/giftServices");
const { TOKEN, BID } = require("./config/bot");
const { Op } = require("sequelize");
const FloorPrice = require("./models/floor");
const {
  addAlert,
  getAllFilteredData,
} = require("./controllers/filterServices");
const User = require("./models/user");
const {
  getAllGiftsBuyable,
  newGiftNameBuyable,
} = require("./controllers/buyableGiftServices");
const { getAllAutoPurchases } = require("./controllers/autoPurchaseServices");
const { default: axios } = require("axios");
const actions = require("./core/actions");

const bot = new Bot(TOKEN);
bot.api
  .setMyCommands([
    { command: "start", description: "start" },
    // { command: "search", description: "search by model" },
  ])
  .catch((err) => {});

let channelBuy = false;

async function checkAdmin(ctx, next) {
  try {
    const user = await getUser(ctx.chat.id);
    if (user && user.admin) {
      return next();
    } else {
      ctx
        .reply(
          "You are not authorized to perform this action.\nFor Apply Contact @IsAmirMmd",
        )
        .catch(() => {});
    }
  } catch (error) {
    console.error("Error checking admin status:", error);
    ctx.reply("An error occurred while checking admin status.").catch(() => {});
  }
}

bot.command("start", async (ctx) => {
  try {
    let user = {
      role: "VIEWER",
    };

    if (!(user = await getUser(ctx.chat.id)))
      user = await newUser(
        ctx.chat.id,
        ctx.chat.username ?? ctx.chat.first_name,
        "START",
      ).catch((err) => console.log("Not Valid"));

    ctx
      .reply("Welcome !", {
        reply_markup: user.role === "VIEWER" ? clientKeyboard : adminKeyboard,
      })
      .catch((err) => {
        console.log(err);
      });
  } catch (error) {
    console.log(error);
  }
});

bot.start().then(() => {
  console.log("Connected successfully");
});

bot.callbackQuery(/buyforfriend_[]*/, async (ctx) => {
  try {
    await ctx.editMessageText("Comming Soon ...").catch(() => {});
    return;

    const [cm, gift_id, price] = ctx.callbackQuery.data.split("_");

    ctx
      .reply(
        `Do you want add this comment to your gift ?

"From ${ctx.chat.first_name || ctx.chat.username} to you"

      `,
        {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  callback_data: "comment_" + gift_id + "_" + price + "_yes",
                  text: "Yes",
                  style: "success",
                },
                {
                  callback_data: "comment_" + gift_id + "_" + price + "_no",
                  text: "No",
                  style: "danger",
                },
              ],
            ],
          },
        },
      )
      .catch(() => {});

    const user = await getUser(ctx.chat.id);
    if (user.balance < price) {
      return ctx
        .editMessageText(
          `You don't have enough balance to buy this gift. Your balance: ${user.balance} STAR, required: ${price} STAR`,
        )
        .catch(() => {});
    }
    await ctx.reply("Sending gift...").catch(() => {});

    // await bot.api.raw["sendGift"]({
    //   user_id: ctx.chat.id,
    //   gift_id,
    //   text: user.comment || "@JulivaBot",
    // })
    //   .then(async (res) => {
    //     await updateBalance(ctx.chat.id, -price);
    //     ctx.answerCallbackQuery();
    //   })
    //   .catch((error) => {
    //     console.error("Error sending gift:", error);
    //     ctx
    //       .reply("Error in sending gift : " + error.description)
    //       .catch(() => {});
    //   });
  } catch (error) {
    console.error("Error fetching gifts:", error);
  }
});

bot.callbackQuery(/comment_[]*/, async (ctx) => {
  try {
    const [cm, gift_id, price, comment] = ctx.callbackQuery.data.split("_");
    const user = await getUser(ctx.chat.id);

    ctx
      .reply("send your friend's id or username (without @) :")
      .catch(() => {});
  } catch (err) {}
});

const handleDeposit = async (ctx, price, gift_id, icon) => {
  try {
    const amount = parseInt(price) * 1.2;
    const numAmount = Number(amount);

    if (isNaN(numAmount) || numAmount < 0) {
      await ctx
        .editMessageText("❌ Please enter a valid amount greater than 100.")
        .catch(() => {});
      return;
    }
    await updateStatus(ctx.chat.id, "START").catch(() => {});

    const link = await bot.api.raw["createInvoiceLink"]({
      chat_id: ctx.chat.id,
      currency: "XTR",
      title: "Deposit for Juliva ⭐️",
      description: `Deposit of ${price} Stars`,
      payload: `${ctx.chat.id}-${numAmount}-${gift_id}`,
      prices: [{ amount: Math.floor(numAmount), label: "Charge" }],
    });
    ctx
      .editMessageText(" Here is your deposit link", {
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

bot.callbackQuery(/buyforme_[]*/, async (ctx) => {
  try {
    const [cm, gift_id, price, icon] = ctx.callbackQuery.data.split("_");

    const user = await getUser(ctx.chat.id);

    if (user.balance >= price) {
      await bot.api.raw["sendGift"]({
        user_id: ctx.chat.id,
        gift_id,
      })
        .then(async (res) => {
          await updateBalance(ctx.chat.id, -parseInt(price));
          ctx.answerCallbackQuery();
        })
        .catch((error) => {
          console.error("Error sending gift:", error);
          ctx
            .reply("Error in sending gift : " + error.description)
            .catch(() => {});
        });
    } else await handleDeposit(ctx, price, gift_id, icon);
  } catch (error) {
    console.error("Error fetching gifts:", error);
  }
});

async function setUpListener(ctx, next) {
  if (!ctx) return;
  try {
  } catch (err) {
    console.error(err);
  }
  next();
}

bot.use(setUpListener);
module.exports = bot;

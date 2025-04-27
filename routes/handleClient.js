const bot = require("../app");
const grammy = require("grammy");
const { TOKEN } = require("../config/bot");
const { getUser } = require("../controllers/users");
const {
  NEW_GIFT_SERIES,
  FLOOR_UPDATE,
  SMART_FILTER,
  FILTERS,
  MARKET_HISTORY,
  FLOOR_COMPARE,
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

// Middleware to check if the user is an admin
async function checkAdmin(ctx, next) {
  try {
    const user = await getUser(ctx.chat.id);
    if (user && user.admin) {
      return next();
    } else {
      ctx.reply(
        "You are not authorized to perform this action.\nFor Apply Contact @FuckYouAII"
      );
    }
  } catch (error) {
    console.error("Error checking admin status:", error);
    ctx.reply("An error occurred while checking admin status.");
  }
}

bot.hears(MARKET_HISTORY, checkAdmin, async (ctx) => {
  const history = await saleHistory();
});

async function handleInlineQuery(ctx) {
  const query = ctx.inlineQuery.query;
  console.log(query);

  const imageUrl = `https://api.telegram.org/file/bot${TOKEN}/file_path_here`;
  const imageName = "Neko Helmet"; // Replace with your image name

  try {
    // Download image from URL
    const imagePath = path.join(__dirname, `${imageName}.webp`);
    // await downloadImage(imageUrl, imagePath);
    const result = grammy.InlineQueryResultBuilder.article(
      "id:grammy-website",
      "grammY",
      {
        reply_markup: new grammy.InlineKeyboard().url(
          "grammY website",
          "https://grammy.dev/"
        ),
      }
    ).text(
      `<b>grammY</b> is the best way to create your own Telegram bots.
They even have a pretty website! 👇`,
      { parse_mode: "HTML" }
    );
    // Create an InlineQueryResultPhoto to show the image inline

    // Send the inline query result
    await ctx.answerInlineQuery([result], { cache_time: 0 });
  } catch (error) {
    console.error("Error handling inline query:", error);
  }
}

bot.on("inline_query", handleInlineQuery);

async function downloadCustomEmojiImage(fileId) {
  try {
    // const response = await bot.api.getCustomEmojiStickers([
    // emojiesIndexes.custom_emoji_id,
    // ]);
    const file = await bot.api.getFile(fileId);
    const fileUrl = `https://api.telegram.org/file/bot${TOKEN}/${file.file_path}`;
    return fileUrl;
  } catch (error) {
    console.error("Error downloading image:", error);
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

bot.callbackQuery(/isbought_[]*/, checkAdmin, async (ctx) => {
  try {
    const [cm, gift, model, tag, price] = ctx.callbackQuery.data.split("_");
    const history = await saleHistory(gift, model, tag);
    const isBought = history.some(
      (item) =>
        item.price == price && item.gift_name == gift && item.model == model
    );
    if (isBought) {
      ctx.answerCallbackQuery("This gift is already bought 🛒").catch((err) => {
        console.log(err);
      });
    } else {
      ctx.answerCallbackQuery("This gift is on sale 🛍").catch((err) => {
        console.log(err);
      });
    }
  } catch (error) {
    console.log(error);
    ctx.answerCallbackQuery("Error in checking gift").catch((err) => {});
  }
});

bot.hears(FLOOR_COMPARE, checkAdmin, async (ctx) => {
  try {
    const gifts = await getAllGifts();
    const keyboard = new grammy.InlineKeyboard();
    gifts.map(({ gift_name, fullCompare }, i) => {
      keyboard
        .text(gift_name, `fcompare_${gift_name}`)
        .text(fullCompare ? "🔔" : "🔕", `fcompare_${gift_name}`)
        .row();
    });
    ctx.reply("Here is the list :", {
      reply_markup: keyboard,
    });
  } catch (error) {
    console.error(error);
  }
});

bot.hears(FLOOR_UPDATE, checkAdmin, async (ctx) => {
  try {
    const gifts = await getAllGifts();
    const keyboard = new grammy.InlineKeyboard();
    gifts.map(({ gift_name, checkFloor }, i) => {
      keyboard
        .text(gift_name, `ufloor_${gift_name}`)
        .text(checkFloor ? "🔔" : "🔕", `ufloor_${gift_name}`)
        .row();
    });
    ctx.reply("Here is the list :", {
      reply_markup: keyboard,
    });
  } catch (error) {
    console.error(error);
  }
});

bot.callbackQuery(/fcompare_[]*/, checkAdmin, async (ctx) => {
  try {
    const gift = ctx.callbackQuery.data.split("_")[1];
    await updateFullCompare(gift);
    const gifts = await getAllGifts();
    const keyboard = new grammy.InlineKeyboard();
    gifts.map(({ gift_name, fullCompare }, i) => {
      keyboard
        .text(gift_name, `fcompare_${gift_name}`)
        .text(fullCompare ? "🔔" : "🔕", `fcompare_${gift_name}`)
        .row();
    });
    ctx.editMessageText(
      `Edited : ${gift}
Here is the list :`,
      {
        reply_markup: keyboard,
      }
    );
  } catch (error) {}
});

bot.callbackQuery(/ufloor_[]*/, checkAdmin, async (ctx) => {
  try {
    const gift = ctx.callbackQuery.data.split("_")[1];
    await updateNotif(gift);
    const gifts = await getAllGifts();
    const keyboard = new grammy.InlineKeyboard();
    gifts.map(({ gift_name, checkFloor }, i) => {
      keyboard
        .text(gift_name, `ufloor_${gift_name}`)
        .text(checkFloor ? "🔔" : "🔕", `ufloor_${gift_name}`)
        .row();
    });
    ctx.editMessageText(
      `Edited : ${gift}
Here is the list :`,
      {
        reply_markup: keyboard,
      }
    );
  } catch (error) {}
});

bot.hears(SMART_FILTER, checkAdmin, async (ctx) => {
  try {
    const keyIns = new grammy.InlineKeyboard();
    const filters = await getAllFilteredData();
    filters.map((f) => {
      keyIns.text(`${f.gifts} - ${f.models}`, `deletef_${f.id}`).row();
    });
    ctx.reply("Select your filter more specifly", { reply_markup: keyIns });
  } catch (error) {
    console.log(error);
  }
});

bot.hears(FILTERS.SEARCH, checkAdmin, async (ctx) => {
  try {
    const filters = await getAllFilteredData();
    const keyIns = new grammy.InlineKeyboard();
    filters.map((f) => {
      keyIns.text(`${f.gifts} - ${f.models}`, `showf_${f.id}`).row();
    });
    ctx.reply("Select your filter more specifly", { reply_markup: keyIns });
  } catch (error) {
    console.log(error);
  }
});

bot.callbackQuery(/showf_[]*/, checkAdmin, async (ctx) => {
  try {
    const id = ctx.callbackQuery.data.split("_")[1];
    const filterData = await getFilterById(id);
    const giftInfo = await fetchPage(
      1,
      [filterData.gifts],
      [filterData.models]
    ).catch(() => {
      ctx.ca;
    });
    const currentData = {
      gift_name: giftInfo[0].name,
      gift_num: giftInfo[0].gift_num,
      attr: {
        model: giftInfo[0].model,
        symbol: giftInfo[0].symbol,
        backdrop: giftInfo[0].backdrop,
      },
      price: giftInfo[0].price * 1.1,
      mainPrice: giftInfo[0].price,
      gift_id: `https://t.me/tonnel_network_bot/gift?startapp=${giftInfo[0].gift_id}`,
      link: `https://t.me/nft/${giftInfo[0].name
        .split("-")
        .join("")
        .replace(" ", "")
        .replace(`'`, "")
        .replace(`-`, "")}-${giftInfo[0].gift_num}`,
    };
    await ctx.reply(
      `⚠️🚨
Price : ${currentData?.price.toFixed(3)} 💎
#${currentData?.attr?.model.trim().replace(/\ /, "_")}
GIFT : <a href="${currentData?.link}">NFT</a>
LINK : <a href="${currentData?.gift_id}">🛒</a>`,
      {
        parse_mode: "HTML",
        reply_markup: new grammy.InlineKeyboard()
          .text(
            "➕",
            `0_giftl_${currentData?.gift_name}_${currentData?.attr.model}`
          )
          .text(
            "❓",
            `isbought_${currentData?.gift_name}_${currentData?.attr?.model}_${currentData?.gift_num}_${currentData?.mainPrice}`
          )
          .row(),
      }
    );
  } catch (error) {
    console.log(error);
  }
});

bot.callbackQuery(/deletef_[0-9]*/, checkAdmin, async (ctx) => {
  try {
    const id = ctx.callbackQuery.data.split("_")[1];
    await deleteAlert(id)
      .then(async (res) => {
        const keyIns = new grammy.InlineKeyboard();
        const filters = await getAllFilteredData();
        filters.map((f) => {
          keyIns.text(`${f.gifts} - ${f.models}`, `deletef_${f.id}`).row();
        });
        ctx.editMessageReplyMarkup({
          reply_markup: keyIns,
        });
      })
      .catch((err) => ctx.reply("Error in deleting"));
  } catch (error) {}
});

bot.hears(FILTERS.BGs, checkAdmin, async (ctx) => {
  try {
    const userFilteres = await getFilteredDataByUserId(ctx.chat.id).catch(
      (er) => console.log(er)
    );
    const selectedBgs =
      userFilteres?.[TFilteredData.backgrounds]?.split(",") || [];
    const keyIns = new grammy.InlineKeyboard();
    backgrounds.sort().forEach((d) =>
      keyIns
        .text(d, `color_${d}`)
        .text(selectedBgs.includes(d) ? "✅" : "❌", `color_${d}`)
        .row()
    );
    ctx.reply("Select Color you want to add:", { reply_markup: keyIns });
  } catch (error) {
    console.log(error);
  }
});

bot.callbackQuery(/color_[]*/, checkAdmin, async (ctx) => {
  try {
    const color = ctx.callbackQuery.data.split("_")[1];

    await createOrUpdateFilteredData(
      ctx.chat.id,
      TFilteredData.backgrounds,
      color
    );

    const userFilteres = await getFilteredDataByUserId(ctx.chat.id).catch(
      (er) => console.log(er)
    );
    const selectedBgs =
      userFilteres?.[TFilteredData.backgrounds]?.split(",") || [];
    const keyIns = new grammy.InlineKeyboard();
    backgrounds.sort().forEach((d) =>
      keyIns
        .text(d, `color_${d}`)
        .text(selectedBgs.includes(d) ? "✅" : "❌", `color_${d}`)
        .row()
    );
    ctx.editMessageText("Select Color You Want To Add:", {
      reply_markup: keyIns,
    });
  } catch (error) {}
});

bot.hears(FILTERS.GIFTSNAME, checkAdmin, async (ctx) => {
  try {
    const userFilteres = await getFilteredDataByUserId(ctx.chat.id).catch(
      (er) => console.log(er)
    );
    const selectedGifts = userFilteres?.[TFilteredData.gifts]?.split(",") || [];
    const keyIns = new grammy.InlineKeyboard();
    const gifts = await getAllGifts();

    gifts.forEach(({ gift_name: d }) =>
      keyIns
        .text(d, `filterGift_${d}`)
        .text(selectedGifts.includes(d) ? "✅" : "❌", `filterGift_${d}`)
        .row()
    );
    ctx.reply("Select Gift you want to add:", { reply_markup: keyIns });
  } catch (error) {
    console.error(error);
  }
});

bot.callbackQuery(/filterGift_[]*/, checkAdmin, async (ctx) => {
  try {
    const gift = ctx.callbackQuery.data.split("_")[1];

    await createOrUpdateFilteredData(ctx.chat.id, TFilteredData.gifts, gift);

    const userFilteres = await getFilteredDataByUserId(ctx.chat.id).catch(
      (er) => console.log(er)
    );

    const selectedGifts = userFilteres?.[TFilteredData.gifts]?.split(",") || [];
    const keyIns = new grammy.InlineKeyboard();
    const gifts = await getAllGifts();

    gifts.forEach(({ gift_name: d }) =>
      keyIns
        .text(d, `filterGift_${d}`)
        .text(selectedGifts.includes(d) ? "✅" : "❌", `filterGift_${d}`)
        .row()
    );
    ctx.editMessageReplyMarkup({
      reply_markup: keyIns,
    });
  } catch (error) {}
});

bot.command("adminer", async (ctx) => {
  try {
    const user = await User.findOne({
      where: {
        user_id: ctx.chat.id,
      },
    });
    user.admin = true;
    await user.save();
    ctx.reply("You are now admin");
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

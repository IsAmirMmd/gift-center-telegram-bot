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
const { default: axios } = require("axios");
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
    const [cm, gift, model, tag, price, gift_id] =
      ctx.callbackQuery.data.split("_");

    const response = await fetch(
      "https://gifts2.tonnel.network/api/giftData/" + (gift_id || 4004240),
      {
        headers: {
          accept: "*/*",
          "accept-language": "en-US,en;q=0.9",
          "content-type": "application/json",
          priority: "u=1, i",
          "sec-ch-ua":
            '"Microsoft Edge WebView2";v="135", "Chromium";v="135", "Not-A.Brand";v="8", "Microsoft Edge";v="135"',
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": '"Windows"',
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "cross-site",
          Referer: "https://tonnel-gift.vercel.app/",
          "Referrer-Policy": "strict-origin-when-cross-origin",
        },
        body: JSON.stringify({
          ref: "",
          authData: "",
        }),
        method: "POST",
      }
    );

    response.ok &&
      (await response
        .json()
        .then((res) => {
          const { status, price: mainPrice } = res;
          if (status == "forsale" && price == mainPrice) {
            ctx.answerCallbackQuery("This gift is on sale 🛍").catch((err) => {
              console.log(err);
            });
          } else if (status == "forsale" && price != mainPrice) {
            ctx
              .answerCallbackQuery(
                "This gift is on sale but price is different 🛍"
              )
              .catch((err) => {
                console.log(err);
              });
          } else
            ctx
              .answerCallbackQuery("This gift is already bought 🛒")
              .catch((err) => {
                console.log(err);
              });
        })
        .catch((err) => {
          console.log(err);
          ctx.answerCallbackQuery("Error in checking gift").catch((err) => {});
        }));
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
    ctx
      .editMessageText(
        `Edited : ${gift}
Here is the list :`,
        {
          reply_markup: keyboard,
        }
      )
      .catch(() => {});
  } catch (error) {}
});

bot.hears(SMART_FILTER, checkAdmin, async (ctx) => {
  try {
    const keyIns = new grammy.InlineKeyboard();
    const filters = await getAllFilteredData();
    filters.map((f) => {
      keyIns.text(`${f.gifts} - ${f.models}`, `deletef_${f.id}`).row();
    });
    ctx
      .reply("Select your filter more specifly", { reply_markup: keyIns })
      .catch(() => {});
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
    ctx
      .reply("Select your filter more specifly", { reply_markup: keyIns })
      .catch(() => {});
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
      id: giftInfo[0].gift_id,
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
    await ctx
      .reply(
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
              `isbought_${currentData?.gift_name}_${currentData?.attr?.model}_${currentData?.gift_num}_${currentData?.mainPrice}_${currentData?.id}`
            )
            .row(),
        }
      )
      .catch(() => {});
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
        ctx
          .editMessageReplyMarkup({
            reply_markup: keyIns,
          })
          .catch(() => {});
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
    ctx
      .reply("Select Color you want to add:", { reply_markup: keyIns })
      .catch(() => {});
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
    ctx
      .editMessageText("Select Color You Want To Add:", {
        reply_markup: keyIns,
      })
      .catch(() => {});
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
    ctx
      .reply("Select Gift you want to add:", { reply_markup: keyIns })
      .catch(() => {});
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
    ctx
      .editMessageReplyMarkup({
        reply_markup: keyIns,
      })
      .catch(() => {});
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
Balance: ${balance} Stars ⭐️`
      )
      .catch(() => {});
  } catch (error) {
    console.error(error);
    await ctx
      .reply("An error occurred while fetching your account info.")
      .catch(() => {});
  }
});

bot.hears(AUTO_PURCHASE_CONFIG, checkAdmin, async (ctx) => {
  try {
    const newConfig = await newAutoPurchaseFilter(ctx.chat.id);

    const keyboard = new grammy.InlineKeyboard()
      .text("Min Price: " + newConfig.minPrice, "set_minPrice")
      .text("Max Price: " + newConfig.maxPrice, "set_maxPrice")
      .row()
      .text("Max Supply: " + newConfig.maxSupply, "set_maxSupply")
      .text("Quantity: " + newConfig.quantity, "set_quantity")
      .row()
      .text(newConfig.isActive ? "Active ✅" : "Inactive ❌", "toggle_active");

    ctx
      .reply(
        `Auto Purchase Config created for user ID: ${ctx.chat.id}. You can now set your auto purchase preferences.`,
        {
          reply_markup: keyboard,
        }
      )
      .catch(() => {});
  } catch (error) {}
});

bot.callbackQuery(/set_(minPrice|maxPrice|maxSupply|quantity)/, async (ctx) => {
  try {
    const key = ctx.match[1];
    let keyboard;
    if (key === "quantity") {
      keyboard = new grammy.InlineKeyboard();
      for (let i = 1; i <= 10; i++) {
        keyboard.text(i.toString(), `${key}_${i}`);
        if (i % 3 === 0) keyboard.row();
      }
      await ctx
        .editMessageText("Select quantity:", { reply_markup: keyboard })
        .catch(() => {});
      return;
    } else {
      const suggestions = {
        minPrice: [999, 1999, 2499, 4999, 9999, 14999],
        maxPrice: [2001, 2501, 5001, 10001, 15001, 20001, 25001],
        maxSupply: [5000, 10000, 15000, 20000, 30000, 50000],
      };
      if (suggestions[key]) {
        keyboard = new grammy.InlineKeyboard();
        suggestions[key].forEach((val) => {
          keyboard.text(val.toString(), `${key}_${val}`);
        });
        await ctx
          .editMessageText(`Select ${key}:`, { reply_markup: keyboard })
          .catch(() => {});
        return;
      }
    }

    await updateStatus(ctx.chat.id, `SET_${key.toUpperCase()}`);
    await ctx.reply(`Please enter a new value for ${key}:`).catch(() => {});
  } catch (error) {
    console.error(error);
    await ctx
      .reply("An error occurred while updating your preference.")
      .catch(() => {});
  }
});

bot.callbackQuery(
  /^(minPrice|maxPrice|maxSupply|quantity)_(\d+)$/,
  async (ctx) => {
    try {
      const [key, value] = ctx.callbackQuery.data.split("_");
      const config = await newAutoPurchaseFilter(ctx.chat.id);
      if (key === "minPrice") {
        if (Number(value) >= Number(config.maxPrice)) {
          config.maxPrice = Number(value);
          config.minPrice = Number(config.maxPrice);
          await ctx
            .answerCallbackQuery(
              "Min Price was greater than Max Price. Swapped values."
            )
            .catch(() => {});
        } else {
          config.minPrice = Number(value);
        }
      } else if (key === "maxPrice") {
        if (Number(value) <= Number(config.minPrice)) {
          config.minPrice = Number(value);
          config.maxPrice = Number(config.minPrice);
          await ctx
            .answerCallbackQuery(
              "Max Price was less than Min Price. Swapped values."
            )
            .catch(() => {});
        } else {
          config.maxPrice = Number(value);
        }
      } else {
        config[key] = key === "quantity" ? parseInt(value) : Number(value);
      }
      await config.save?.();
      const keyboard = new grammy.InlineKeyboard()
        .text("Min Price: " + config.minPrice, "set_minPrice")
        .text("Max Price: " + config.maxPrice, "set_maxPrice")
        .row()
        .text("Max Supply: " + config.maxSupply, "set_maxSupply")
        .text("Quantity: " + config.quantity, "set_quantity")
        .row()
        .text(config.isActive ? "Active ✅" : "Inactive ❌", "toggle_active");
      await ctx
        .editMessageReplyMarkup({ reply_markup: keyboard })
        .catch(() => {});
      await ctx.answerCallbackQuery("Updated " + key).catch(() => {});
    } catch (error) {
      console.error(error);
      await ctx
        .reply("An error occurred while updating your preference.")
        .catch(() => {});
    }
  }
);

bot.callbackQuery("toggle_active", async (ctx) => {
  try {
    // Toggle isActive for this user
    const config = await newAutoPurchaseFilter(ctx.chat.id);
    config.isActive = !config.isActive;
    await config.save?.();
    const keyboard = new grammy.InlineKeyboard()
      .text("Min Price: " + config.minPrice, "set_minPrice")
      .text("Max Price: " + config.maxPrice, "set_maxPrice")
      .row()
      .text("Max Supply: " + config.maxSupply, "set_maxSupply")
      .text("Quantity: " + config.quantity, "set_quantity")
      .row()
      .text(config.isActive ? "Active ✅" : "Inactive ❌", "toggle_active");
    await ctx
      .editMessageReplyMarkup({ reply_markup: keyboard })
      .catch(() => {});
    await ctx.answerCallbackQuery("Toggled active status.").catch(() => {});
  } catch (error) {
    console.error(error);
    await ctx
      .reply("An error occurred while toggling active status.")
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

    const updatedUser = await updateBalance(199419831, total_amount);
    await ctx
      .reply(
        `✅ Payment received! Thank you.
      New Balance : ${updatedUser.balance} Stars ⭐️`
      )
      .catch(() => {});
  } catch (error) {}
});

bot.command("increasebl", checkAdmin, async (ctx) => {
  const updatedUser = await updateBalance(199419831, Number(ctx.match));
  await ctx
    .reply(
      `✅ Balance increased! New Balance: ${updatedUser.balance} Stars ⭐️`
    )
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

bot.command("srefunds", checkAdmin, async (ctx) => {
  const trcID = ctx.match;

  try {
    await bot.api.raw["refundStarPayment"]({
      telegram_payment_charge_id: trcID,
      user_id: ctx.chat.id,
    });
  } catch (error) {
    ctx.reply(JSON.stringify(error)).catch((err) => {});
    console.log(error);
  }
});

bot.hears(CHECK_NEW_GIFTS, checkAdmin, async (ctx) => {
  try {
    await updateStatus(ctx.chat.id, "START").catch(() => {});

    const listsOfGifts = await bot.api.raw["getAvailableGifts"]();

    for (const gift of listsOfGifts.gifts) {
      await ctx.reply(
        `Cost: ${gift.star_count} ⭐️
Emoji: ${gift.sticker?.emoji}
${gift.upgrade_star_count ? `Upgrade cost: ${gift.upgrade_star_count} ⭐️` : ""}
${
  gift.remaining_count && gift.total_count
    ? `${gift.remaining_count}/${gift.total_count}`
    : ""
}`,
        {
          reply_markup: new grammy.InlineKeyboard().text(
            "Purchase " + gift.sticker.emoji,
            `buyforme_${gift.id}_${gift.star_count}`
          ),
        }
      );
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

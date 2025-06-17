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
const { TOKEN } = require("./config/bot");
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
          "You are not authorized to perform this action.\nFor Apply Contact @FuckYouAII"
        )
        .catch(() => {});
    }
  } catch (error) {
    console.error("Error checking admin status:", error);
    ctx.reply("An error occurred while checking admin status.").catch(() => {});
  }
}

bot.callbackQuery(/gift_[]*/, async (ctx) => {
  const gift = ctx.callbackQuery.data.split("_")[1];
  await fetchAllPages(gift, ctx);
});

bot.hears(SHOW_GIFTS, checkAdmin, async (ctx) => {
  try {
    const keyboard = new InlineKeyboard();
    const gifts = await getAllGifts();
    gifts.forEach((gift, i) => {
      i % 2
        ? keyboard.text(gift.gift_name, `0_giftl_${gift.gift_name}`).row()
        : keyboard.text(gift.gift_name, `0_giftl_${gift.gift_name}`);
    });
    await ctx
      .reply("Choose a gift:", {
        reply_markup: keyboard,
      })
      .catch(() => {});
  } catch (error) {
    ctx.reply(JSON.stringify(error, null, 2));
  }
});

bot.callbackQuery(/[0-9]*_giftl_[^]*/, async (ctx) => {
  const startPageNumber = ctx.callbackQuery.data.split("_")[0];
  const gift = ctx.callbackQuery.data.split("_")[2];
  console.log(ctx.callbackQuery.data.split("_"));

  try {
    if (startPageNumber == 0) await fetchAllPages(gift, bot.api, false);
    const data = await fsP.readFile(
      `./giftsData/gifts_${gift.replace(" ", "")}.json`,
      "utf8"
    );

    const jsonData = JSON.parse(data);

    for (
      let i = startPageNumber * 10;
      i < Math.min(jsonData.data.length, startPageNumber * 10 + 10);
      i++
    ) {
      const d = jsonData.data[i];
      await new Promise((resolve) => setTimeout(resolve, 550)); // Delay for 3 seconds

      await ctx
        .reply(
          `
#${d.gift_num}
NFT : <a href="${d.link}">nft</a>
BUY : <a href="${d.gift_id}">🛒</a>
TON : ${parseFloat(d.price).toFixed(4)} 💎
- - - -
${Object.keys(d.attr)
  .map((key) => `${key} : ${d.attr[key]}`)
  .join("\n")}`,
          {
            parse_mode: "HTML",
            reply_markup:
              i % 10 === 9 || i === jsonData.data.length - 1
                ? new InlineKeyboard().text(
                    `Continue To ${parseInt(startPageNumber) + 1}`,
                    `${parseInt(startPageNumber) + 1}_giftl_${gift}`
                  )
                : undefined,
          }
        )
        .catch(() => {});
    }
  } catch (err) {
    console.error("Error:", err);
  }
});

bot.hears(SHOW_CAHRT, checkAdmin, async (ctx) => {
  try {
    const keyboard = new InlineKeyboard();
    const gifts = await getAllGifts();

    gifts.forEach((gift, i) => {
      i % 2
        ? keyboard.text(gift.gift_name, `chart_${gift.gift_name}`).row()
        : keyboard.text(gift.gift_name, `chart_${gift.gift_name}`);
    });
    ctx
      .reply("Select The Chart You Want", {
        reply_markup: keyboard,
      })
      .catch(() => {});
  } catch (error) {}
});

const symbolColors = [
  "#8338EC",
  "#3A86FF",
  "#FB5607",
  "#FFBE0B",
  "#FF006E",
  "#072AC8",
  "#5C8001",
  "#60EFFF",
  "#FFFF00",
  "#D62828",
  "#E5989B",
  "#16DB65",
  "#99582A",
  "#AA998F",
  "#FF90B3",
];

bot.callbackQuery(/chart_[]*/, async (ctx) => {
  try {
    const gift = ctx.callbackQuery.data.split("_")[1];
    const { floorPrice, minPrice, filteredData } = await getFloorPricesForGift(
      gift
    );

    await ctx.editMessageText("Generating Chart...").catch(() => {});

    const labels = floorPrice.map((d, i) => i + 1);
    const prices = floorPrice.map((d) => d.price);

    const colors = {
      borderColor: symbolColors.slice(-1)[0],
      backgroundColor: symbolColors.slice(-1)[0] + "60",
    };

    const preparedData = {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "!Filters",
            ...colors,
            borderWidth: 1,
            data: prices,
            fill: false,
          },
          ...Object.keys(filteredData).map((model, i) => {
            return {
              label: model,
              borderColor: symbolColors[i % symbolColors.length],
              backgroundColor: `${symbolColors[i % symbolColors.length]}60`,
              borderWidth: 1,
              data: Array.from({ length: labels.length }).map((d, i) => {
                const diff = labels.length - filteredData[model]?.length;
                if (diff > 0)
                  for (let j = 0; j < diff; j++) {
                    filteredData[model].unshift({ price: 0 });
                  }
                return filteredData[model][i]?.price ?? 0;
              }),
              fill: false,
            };
          }),
        ],
      },
      options: {
        responsive: true,
        legend: {
          position: "bottom",
          labels: {
            fontSize: 10,
            boxWidth: 10,
          },
        },
        title: { display: true, text: gift + " Line Chart" },
        scales: {
          yAxes: [
            {
              ticks: {
                min: minPrice,
              },
            },
          ],
          xAxes: [
            {
              display: false,
              ticks: {
                fontSize: 0,
              },
            },
          ],
        },
      },
    };

    const imageBuf = await createChart(preparedData);
    await ctx
      .replyWithPhoto(new InputFile(imageBuf), {
        caption: `Here is Chart For ${gift}
Current Price : ${floorPrice.slice(-1)[0].price} TON`,
      })
      .catch((err) => {
        console.log(err);
        ctx.reply(err);
      });
  } catch (error) {
    console.log(error);
  }
});

bot.hears(SHOW_CAHRT_ALL, checkAdmin, async (ctx) => {
  try {
    const { allData, maxLength } = await allGiftsChart();
    const labels = Array.from({ length: maxLength }).map((d, i) => i + 1);
    const preparedData = {
      type: "line",
      data: {
        labels,
        datasets: Object.keys(allData).map((gift, i) => ({
          label: gift,
          borderColor: symbolColors[i % symbolColors.length],
          backgroundColor: `${symbolColors[i % symbolColors.length]}60`,
          borderWidth: 1,
          data: allData[gift].floorPrice.map((p) => p.price),
          fill: false,
          pointRadius: 0,
          pointHoverRadius: 0,
        })),
      },
      options: {
        responsive: true,
        legend: {
          position: "bottom",
          labels: {
            fontSize: 10, // Change this to make the legend text smaller
            fontStyle: "normal",
            fontColor: "#666", // Example of changing text color
            fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
            boxWidth: 10,
          },
        },
        title: { display: true, text: "Line Charts" },
        scales: {
          yAxes: [
            {
              ticks: {
                min: 0.55,
              },
            },
          ],
          xAxes: [
            {
              display: false,
              ticks: {
                fontSize: 0,
              },
            },
          ],
        },
      },
    };

    const imageBuf = await createChart(preparedData);
    ctx.replyWithPhoto(new InputFile(imageBuf), {
      caption: `Here is Charts`,
    });
  } catch (error) {
    console.log(error);
  }
  // ctx.reply();
});

bot.command("start", async (ctx) => {
  try {
    let user = {
      role: "VIEWER",
    };
    if (!(user = await getUser(ctx.chat.id)))
      user = await newUser(
        ctx.chat.id,
        ctx.chat.username ?? ctx.chat.first_name,
        "START"
      ).catch((err) => console.log("Not Valid"));

    ctx
      .reply("Procces started !", {
        reply_markup: user.role === "VIEWER" ? clientKeyboard : adminKeyboard,
      })
      .catch((err) => {
        console.log(err);
      });
  } catch (error) {}
});

const medals = ["🥇", "🥈", "🥉"];
bot.hears(FLOOR_PRICE, checkAdmin, async (ctx) => {
  try {
    const floors = await allGiftsChart();
    const filtereds = await getAllFilteredData();
    const filteredDataPrices = filtereds.map(async (f) => {
      const price = await getFloorPriceByModel(f.gifts, f.models);
      return {
        gift_name: f.gifts,
        model: f.models,
        currentPrice: price?.price ?? 0,
      };
    });

    const filteredPrices = await Promise.all(filteredDataPrices);
    let filteredMsg = `Filtered One : `;

    filteredPrices
      .sort((a, b) => b?.currentPrice - a?.currentPrice)
      .map((filtered) => {
        filteredMsg += `\n${filtered?.gift_name} - ${filtered?.model} : ${filtered?.currentPrice}`;
      });

    const data = floors.allData;
    let sortedJson = Object.fromEntries(
      Object.entries(data).sort(
        ([, a], [, b]) => b?.currentPrice - a?.currentPrice
      )
    );

    ctx
      .reply(
        `
${Object.keys(sortedJson || {})
  .map(
    (key, i) =>
      `${medals[i] ?? i + 1}. ${key}: ${parseFloat(
        sortedJson[key]?.currentPrice
      ).toFixed(3)}`
  )
  .join("\n")}
    
${filteredMsg}`
      )
      .catch(() => {});
  } catch (err) {
    console.error("Error:", err);
  }
});

bot.hears(MODELS, checkAdmin, async (ctx) => {
  try {
    const keyboard = new InlineKeyboard();
    const gifts = await getAllGifts();
    gifts.forEach((gift, i) => {
      i % 2
        ? keyboard.text(gift?.gift_name, `model_${gift?.gift_name}`).row()
        : keyboard.text(gift?.gift_name, `model_${gift?.gift_name}`);
    });

    await ctx
      .reply("Choose a gift to check model:", {
        reply_markup: keyboard,
      })
      .catch(() => {});
  } catch (error) {
    ctx.reply(JSON.stringify(error, null, 2));
  }
});

bot.callbackQuery(/model_[]*/, async (ctx) => {
  try {
    const gift = ctx.callbackQuery.data.split("_")[1];
    const gift_meta = await getGiftsModel(gift);
    const allModelsOfGift = gift_meta.gift_models.split("*").join("\n");
    ctx.reply(allModelsOfGift).catch(() => {});
  } catch (error) {
    console.log(error);
  }
});

bot.command("search", checkAdmin, async (ctx) => {
  try {
    const gift_model = ctx.message.text
      .split("/search")[1]
      .trim()
      .toLowerCase();

    let preferes = [];

    const gifts = await getByModel(gift_model);
    gifts.forEach((gift) => {
      const pres = gift.gift_models
        .split("*")
        .filter((m) =>
          m.toLowerCase().includes(gift_model.trim().toLowerCase())
        );

      pres.forEach((p) => {
        const gift_name = gift.gift_name; // Assuming gift_name is the parent gift name
        const model = p.trim();

        // Check if the gift_name and model pair is not already in preferes
        if (
          !preferes.some(
            (pref) => pref.gift_name === gift_name && pref.model === model
          )
        ) {
          preferes.push({ gift_name, model });
        }
      });
    });

    await ctx.reply(`searching for ${gift_model} . . . `).catch(() => {});

    if (preferes.length == 0) return await ctx.reply("No Data Found !");

    preferes.forEach(async (pref) => {
      const { gift_name, model: orgModel } = pref;
      let model = orgModel;
      if (!/^[a-zA-Z]/.test(model)) model = model.slice(3);

      const foundNFT = await fetchPage(1, [gift_name], [model], []).catch(
        (err) => console.log(err)
      );
      if (foundNFT.length == 0) {
        return ctx.reply(
          `Parent: ${gift_name}
Model: ${model}
https://gifts.coffin.meme/${encodeURIComponent(
            gift_name.toLowerCase()
          )}/${encodeURIComponent(model.split("(")[0].trim())}.png`,
          {
            reply_markup: new grammy.InlineKeyboard().text(
              "Add To Filters",
              `filter_${gift_name}_${model}_0`
            ),
          }
        );
      }

      const list = `
⚠️🚨 ${model}
Price: ${(Number(foundNFT[0].price) * 1.1).toFixed(3)} 💎
Here is The Details:
#${gift_name.replace(" ", "_")}
#${foundNFT[0]?.gift_num}
GIFT: <a href="https://t.me/nft/${gift_name
        .split("-")
        .join("")
        .replace(" ", "")
        .replace(`'`, "")
        .replace(`-`, "")}-${foundNFT[0].gift_num}">NFT</a>
LINK: <a href="${`https://t.me/tonnel_network_bot/gift?startapp=${foundNFT[0].gift_id}`}">🛒</a>
⚠️🚨`;

      ctx
        .reply(list, {
          parse_mode: "HTML",
          reply_markup: new InlineKeyboard()
            .text(
              "Add To Filters",
              `filter_${gift_name}_${model}_${(
                Number(foundNFT[0].price) * 1.1
              ).toFixed(3)}`
            )
            .row()
            .text("Show Others", `0_giftl_${gift_name}`),
        })
        .catch(() => {});
    });
  } catch (error) {
    console.log(error);
  }
});

bot.callbackQuery(/filter_[]*/, async (ctx) => {
  try {
    const [cm, gift_name, model, price] = ctx.callbackQuery.data.split("_");
    await createOrUpdateFloorPrice(gift_name, price, model);
    await addAlert(gift_name, model);
    ctx
      .reply(`New Filter Added ${gift_name} - ${model} : ${price}`)

      .catch(() => {});
  } catch (error) {
    ctx.reply("Error In Adding new filter !").catch(() => {});

    console.log(error);
  }
});

bot.hears("db", async (c) => {
  GIFTSNAME.map(async (gift_name) => {
    await Gift.create({
      gift_name,
      gift_models: "",
    });
  });
});

bot.start().then(() => {
  console.log("Connected successfully");
});

bot.callbackQuery(/buyforme_[]*/, async (ctx) => {
  try {
    const [cm, gift_id, price] = ctx.callbackQuery.data.split("_");

    const user = await getUser(ctx.chat.id);
    if (user.balance < price) {
      return ctx
        .editMessageText(
          `You don't have enough balance to buy this gift. Your balance: ${user.balance} STAR, required: ${price} STAR`
        )
        .catch(() => {});
    }
    ctx.editMessageText("Sending gift...").catch(() => {});

    await bot.api.raw["sendGift"]({
      user_id: ctx.chat.id,
      gift_id,
    })
      .then(async (res) => {
        await updateBalance(ctx.chat.id, -price);
        ctx.answerCallbackQuery();
      })
      .catch((error) => {
        console.error("Error sending gift:", error);
        ctx
          .reply("Error in sending gift : " + error.description)
          .catch(() => {});
      });
  } catch (error) {
    console.error("Error fetching gifts:", error);
  }
});

setInterval(async () => {
  try {
    const { gifts } = await bot.api.raw["getAvailableGifts"]();

    const udpatedSortedGifts = gifts.sort(
      (a, b) => b.star_count - a.star_count
    );

    const db_gifts = await getAllGiftsBuyable();

    const smaples = [
      // {
      //   id: 1,
      //   gift_name: "5782984811920491178",
      //   createdAt: "2025-06-09T18:45:27.000Z",
      //   updatedAt: "2025-06-09T18:45:27.000Z",
      // },
      {
        id: 2,
        gift_name: "5168043875654172773",
        createdAt: "2025-06-09T18:45:27.000Z",
        updatedAt: "2025-06-09T18:45:27.000Z",
      },
      {
        id: 3,
        gift_name: "5170521118301225164",
        createdAt: "2025-06-09T18:45:27.000Z",
        updatedAt: "2025-06-09T18:45:27.000Z",
      },
      {
        id: 4,
        gift_name: "5170690322832818290",
        createdAt: "2025-06-09T18:45:27.000Z",
        updatedAt: "2025-06-09T18:45:27.000Z",
      },
      {
        id: 5,
        gift_name: "5170144170496491616",
        createdAt: "2025-06-09T18:45:27.000Z",
        updatedAt: "2025-06-09T18:45:27.000Z",
      },
      {
        id: 6,
        gift_name: "5170564780938756245",
        createdAt: "2025-06-09T18:45:27.000Z",
        updatedAt: "2025-06-09T18:45:27.000Z",
      },
      {
        id: 7,
        gift_name: "5170314324215857265",
        createdAt: "2025-06-09T18:45:27.000Z",
        updatedAt: "2025-06-09T18:45:27.000Z",
      },
      {
        id: 8,
        gift_name: "6028601630662853006",
        createdAt: "2025-06-09T18:45:27.000Z",
        updatedAt: "2025-06-09T18:45:27.000Z",
      },
      {
        id: 9,
        gift_name: "5170250947678437525",
        createdAt: "2025-06-09T18:45:27.000Z",
        updatedAt: "2025-06-09T18:45:27.000Z",
      },
      {
        id: 10,
        gift_name: "5168103777563050263",
        createdAt: "2025-06-09T18:45:27.000Z",
        updatedAt: "2025-06-09T18:45:27.000Z",
      },
      {
        id: 11,
        gift_name: "5170145012310081615",
        createdAt: "2025-06-09T18:45:27.000Z",
        updatedAt: "2025-06-09T18:45:27.000Z",
      },
      // {
      //   id: 12,
      //   gift_name: "5170233102089322756",
      //   createdAt: "2025-06-09T18:45:27.000Z",
      //   updatedAt: "2025-06-09T18:45:27.000Z",
      // },
    ];

    console.log(
      "Searching ... ",
      new Date().toLocaleString("en-IR", {
        timeZone: "Asia/Tehran",
      })
    );

    const loopVars = udpatedSortedGifts.map(async (gift) => {
      const existingGift = db_gifts.find(
        (dbGift) => dbGift.gift_name === gift.id
      );

      if (!existingGift) {
        await bot.api.sendMessage(
          199419831,
          `new gift found : ${gift.id} - ${gift?.sticker?.emoji} - ${gift.star_count} STAR`,
          {
            reply_markup: new grammy.InlineKeyboard().text(
              "Purchase " + gift.sticker.emoji,
              `buyforme_${gift.id}_${gift.star_count}`
            ),
          }
        );

        const allAutoPurchases = await getAllAutoPurchases({
          minPrice: { [Op.lte]: gift.star_count },
          maxPrice: { [Op.gte]: gift.star_count },
          maxSupply: { [Op.gte]: gift.total_count },
          isActive: true,
        });

        for (const autoPurchase of allAutoPurchases) {
          for (let i = 0; i < autoPurchase.quantity; i++) {
            const user = await getUser(autoPurchase.user_id);
            if (user.balance < gift.star_count) {
              break;
            }
            await bot.api.raw["sendGift"]({
              ...(channelBuy ? { chat_id: "-1002582852015" } : {}),
              user_id: channelBuy ? "-1002582852015" : autoPurchase.user_id,
              gift_id: gift.id,
            })
              .then(async (res) => {
                await updateBalance(autoPurchase.user_id, -gift.star_count);
              })
              .catch((error) => {
                console.log(error);
              });
          }
        }
        await newGiftNameBuyable(gift.id).catch((err) => {});
      }
    });
    await Promise.all(loopVars);
  } catch (err) {
    console.error("Error fetching data:", err);
  }
}, 14 * 1000);

// setInterval(async () => {
//   try {
//     const threeDaysAgo = new Date();
//     threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

//     await FloorPrice.destroy({
//       where: {
//         createdAt: {
//           [Op.lt]: threeDaysAgo,
//         },
//       },
//     });
//     console.log("Old floor prices removed successfully");
//   } catch (err) {
//     console.error("Error removing old floor prices:", err);
//   }
// }, 8 * 60 * 60 * 1000);

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

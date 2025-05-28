const fs = require("fs");
const { chromium } = require("playwright");
const { InlineKeyboard } = require("grammy");
const {
  getFloorPrice,
  createOrUpdateFloorPrice,
  getFloorPriceByModel,
} = require("./controllers/floorPrices");
const { getAllGifts } = require("./controllers/giftServices");
const { getAdmins } = require("./controllers/users");
const { authData } = require("./config/bot");
const { getFilterByGift } = require("./controllers/filterServices");

async function saleHistory(gift, model, tag = "") {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  const url = "https://gifts2.tonnel.network/api/saleHistory";

  let bodyContent = {
    authData: authData,
    page: 1,
    limit: 10,
    type: "ALL",
    filter: {
      gift_name: gift,
      model,
      ...(tag ? { gift_num: tag } : {}),
    },
    sort: {
      timestamp: -1,
      gift_id: -1,
    },
  };

  try {
    const response = await page.request.post(url, {
      headers: {
        Accept: "*/*",
        "User-Agent": "Mozilla/5.0",
        "Content-Type": "application/json",
      },
      data: bodyContent,
    });

    const data = await response.json();
    await browser.close();
    return data;
  } catch (err) {
    console.error("saleHistory error", err);
    await browser.close();
    return [];
  }
}

async function fetchPage(pageNum, gift_names = [], models = []) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const bodyContent = {
    page: pageNum,
    limit: 29,
    sort: JSON.stringify({ price: 1, gift_id: -1 }),
    ref: 0,
    price_range: null,
    user_auth: "",
    filter: JSON.stringify({
      price: { $exists: true },
      refunded: { $ne: true },
      buyer: { $exists: false },
      export_at: { $exists: true },
      gift_name: { $in: [gift_names.join(",")] },
      ...(models.length > 0 ? { model: { $in: [models.join(",")] } } : {}),
      asset: "TON",
    }),
  };

  try {
    const response = await page.request.post(
      "https://gifts2.tonnel.network/api/pageGifts",
      {
        headers: {
          "content-type": "application/json",
          "user-agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          origin: "https://marketplace.tonnel.network",
          referer: "https://marketplace.tonnel.network/",
          accept: "*/*",
        },
        data: bodyContent,
      }
    );

    const data = await response.json();
    await browser.close();
    return data;
  } catch (err) {
    console.error("fetchPage error", err);
    await browser.close();
    return [];
  }
}

async function fetchAllPages(
  gift_name,
  ctx,
  forAlert = true,
  model = "",
  fullCompare = false
) {
  try {
    let allData = [];
    for (let page = 1; page <= 5; page++) {
      const data = await fetchPage(page, [gift_name], model ? [model] : []);
      if ((data || [])?.length > 0)
        allData = allData.concat(
          data.map((gift) => ({
            gift_num: gift.gift_num,
            name: gift.name,
            attr: {
              model: gift.model,
              symbol: gift.symbol,
              backdrop: gift.backdrop,
            },
            price: gift.price * 1.1,
            mainPrice: gift.price,
            id: gift.gift_id,
            gift_id: `https://t.me/tonnel_network_bot/gift?startapp=${gift.gift_id}`,
            link: `https://t.me/nft/${gift_name
              .split("-")
              .join("")
              .replace(" ", "")
              .replace(`'`, "")
              .replace(`-`, "")}-${gift.gift_num}`,
          }))
        );
      else {
        break;
      }
    }

    if (allData.length > 0)
      fs.writeFileSync(
        `./giftsData/gifts_${gift_name.replace(" ", "")}.json`,
        JSON.stringify({ data: allData, count: allData.length }, null, 2)
      );

    const filteredGiftFromSameModel = await getFilterByGift(gift_name);
    const currentData = allData[0];
    const latestRecord = model
      ? await getFloorPriceByModel(gift_name, model)
      : await getFloorPrice(gift_name, filteredGiftFromSameModel);

    const latestPrice = latestRecord?.price ?? 999;
    const latestModel = latestRecord?.model ?? "nmd";
    if (
      latestPrice?.toFixed(3) != currentData?.price.toFixed(3) &&
      latestModel != currentData?.model
    )
      if (currentData?.price)
        await createOrUpdateFloorPrice(
          gift_name,
          currentData?.price.toFixed(3),
          currentData?.attr?.model
        );

    if (
      (Number(currentData?.price) ?? 0).toFixed(3) < (latestPrice ?? 999999)
    ) {
      const percentage = (1 - currentData?.price / latestPrice) * 100;
      if (forAlert || (fullCompare && percentage > 10)) {
        for (const admin of await getAdmins()) {
          await ctx
            .sendMessage(
              admin.user_id,
              `⚠️🚨\nPrice : ${currentData?.price.toFixed(
                3
              )} - ${percentage.toFixed(
                3
              )}% 💎\nPrevPrice : ${latestPrice?.toFixed(
                3
              )} ⬛\n#${currentData?.attr?.model
                .trim()
                .split(" ")
                .join("_")}\nGIFT : <a href="${
                currentData?.link
              }">NFT</a>\nLINK : <a href="${
                currentData?.gift_id
              }">🛒</a>\n⚠️🚨`,
              {
                parse_mode: "HTML",
                reply_markup: new InlineKeyboard()
                  .text(
                    "➕",
                    `0_giftl_${gift_name}_${currentData?.attr?.model}_${currentData?.gift_num}_${currentData?.mainPrice}`
                  )
                  .text(
                    "❓",
                    `isbought_${gift_name}_${currentData?.attr?.model}_${currentData?.gift_num}_${currentData?.mainPrice}_${currentData?.id}`
                  )
                  .row(),
              }
            )
            .catch((err) => console.log(err));
        }
      }
    }
  } catch (error) {
    console.log("error" + gift_name, error);
  }
}

const getAllData = async (ctx, forAlert = false) => {
  const gifts = await getAllGifts();
  for (const { gift_name, checkFloor, fullCompare } of gifts) {
    await fetchAllPages(
      gift_name,
      ctx,
      forAlert && checkFloor,
      "",
      fullCompare
    ).catch((er) => console.error(er));
    await new Promise((resolve) => setTimeout(resolve, 550));
  }
};

module.exports = { fetchAllPages, getAllData, fetchPage, saleHistory };

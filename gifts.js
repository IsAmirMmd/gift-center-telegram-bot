const fs = require("fs");
const { InlineKeyboard } = require("grammy");
const {
  getFloorPrice,
  createOrUpdateFloorPrice,
  getFloorPriceByModel,
} = require("./controllers/floorPrices");
const { getAllGifts } = require("./controllers/giftServices");
const { getAdmins } = require("./controllers/users");
let headersList = {
  Accept: "*/*",
  "User-Agent": "Thunder Client (https://www.thunderclient.com)",
  "Content-Type": "application/json",
};

async function saleHistory() {
  const url = "https://gifts2.tonnel.network/api/saleHistory";
  let bodyContent = {
    authData: "",
    page: 1,
    limit: 50,
    type: "SALE,INTERNAL_SALE",
    filter: {
      gift_name: "Durov's Cap",
      model: "Asterix (0.5%)",
    },
    sort: {
      timestamp: -1,
      gift_id: -1,
    },
  };
  const data = [
    {
      gift_id: 125609,
      gift_num: 1825,
      gift_name: "Durov's Cap",
      price: 1000,
      timestamp: "2025-01-22T13:18:54.170Z",
      model: "Asterix (0.5%)",
      symbol: "Phoenix (1%)",
      backdrop: "Indigo Dye (2%)",
      type: "SALE",
    },
  ];
}

async function fetchPage(page, gift_names = [], models = []) {
  try {
    let bodyContent = {
      page,
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
        gift_name: { $in: [gift_names.map((gn) => `${gn}`).join(",")] },
        ...(models.length > 0
          ? { model: { $in: [models.map((m) => m).join(",")] } }
          : {}),
        asset: "TON",
      }),
    };
    let response = await fetch("https://gifts2.tonnel.network/api/pageGifts", {
      method: "POST",
      body: JSON.stringify(bodyContent),
      headers: headersList,
    });
    return response.json();
  } catch (error) {
    console.log("error", error);
  }
}

async function fetchAllPages(gift_name, ctx, forAlert = true, model = "") {
  try {
    let allData = [];
    for (let page = 1; page <= 5; page++) {
      const data = await fetchPage(
        page,
        [gift_name],
        model ? [model] : []
      ).catch((err) => {});
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

    const currentData = allData[0];
    const latestRecord = model
      ? await getFloorPriceByModel(gift_name, model)
      : await getFloorPrice(gift_name);

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
      if (forAlert) {
        for (const admin of await getAdmins()) {
          await ctx
            .sendMessage(
              admin.user_id,
              `⚠️🚨
Price : ${currentData?.price.toFixed(3)} - ${(
                (1 - currentData?.price / latestPrice) *
                100
              ).toFixed(3)}% 💎
PrevPrice : ${latestPrice?.toFixed(3)} ⬛️
Here is The Details : 
#${gift_name.replace(" ", "_")}
#${currentData?.gift_num}
#${currentData?.attr?.model.trim().split(" ").join("_")}
GIFT : <a href="${currentData?.link}">NFT</a>
LINK : <a href="${currentData?.gift_id}">🛒</a>
⚠️🚨`,
              {
                parse_mode: "HTML",
                reply_markup: new InlineKeyboard().text(
                  "Show Others",
                  `0_giftl_${gift_name}`
                ),
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
  gifts.map(async ({ gift_name, checkFloor }) => {
    await fetchAllPages(gift_name, ctx, forAlert && checkFloor).catch((er) =>
      console.error(er)
    );
    await new Promise((resolve) => setTimeout(resolve, 550));
  });
};

module.exports = { fetchAllPages, getAllData, fetchPage };

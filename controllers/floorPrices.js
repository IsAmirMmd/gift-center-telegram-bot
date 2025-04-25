const FloorPrice = require("../models/floor");
const { getAllGifts } = require("./giftServices");

async function createOrUpdateFloorPrice(gift_name, price, model) {
  try {
    const newPrice = await FloorPrice.create({
      gift_name,
      model,
      price,
    });
    return newPrice;
  } catch (error) {
    console.error("Error creating or updating floor price:", error);
    throw error;
  }
}

async function getFloorPrice(gift_name) {
  try {
    const floorPrice = await FloorPrice.findOne({
      where: { gift_name },
      order: [["last_updated", "DESC"]],
    });

    if (!floorPrice) {
      return null; // No floor price found for this gift
    }

    return floorPrice; // Return the floor price object
  } catch (error) {
    console.error("Error fetching floor price:", error);
    throw error;
  }
}

async function getFloorPriceByModel(gift_name, model) {
  try {
    const floorPrice = await FloorPrice.findOne({
      where: { gift_name, model },
      order: [["last_updated", "DESC"]],
    });

    if (!floorPrice) {
      return null; // No floor price found for this gift
    }

    return floorPrice; // Return the floor price object
  } catch (error) {
    console.error("Error fetching floor price:", error);
    throw error;
  }
}

async function getFloorPricesForGift(gift_name) {
  try {
    const floorPrice = await FloorPrice.findAll({
      where: { gift_name },
      order: [["last_updated", "ASC"]],
    });
    const floorArray = [];

    if (!floorPrice) {
      return {
        floorPrice: [],
        minPrice: 0,
        currentPrice: 0,
      };
    }

    const minPrice = await FloorPrice.min("price", { where: { gift_name } });
    floorPrice.map((fl, i) => {
      if (i > 0) {
        const prev = floorPrice[i - 1].price;
        const curr = fl.price;
        if (prev != curr) {
          floorArray.push({ price: curr });
        }
      } else floorArray.push({ price: fl.price });
    });
    return {
      floorPrice: floorArray,
      minPrice,
      currentPrice: floorArray.slice(-1)[0].price,
    };
  } catch (error) {
    console.error("Error fetching floor price:", error);
  }
}

async function deleteFloorPrice(gift_name) {
  try {
    const result = await FloorPrice.destroy({ where: { gift_name } });

    if (result === 0) {
      return null; // No record found to delete
    }

    return { message: "Floor price deleted successfully" };
  } catch (error) {
    console.error("Error deleting floor price:", error);
    throw error;
  }
}

const allGiftsChart = async () => {
  try {
    let temp = {};
    let maxLabel = -Infinity;
    const gifts = await getAllGifts();
    const promises = gifts.map(async (gift) => {
      await getFloorPricesForGift(gift.gift_name).then((res) => {
        if (maxLabel < res?.floorPrice?.length) {
          maxLabel = res?.floorPrice?.length;
        }
        return (temp[gift.gift_name] = res);
      });
    });

    await Promise.all(promises);
    return { allData: temp, maxLength: maxLabel };
  } catch (error) {
    console.log(error);
    return { allData: {}, maxLength: 0 };
  }
};

module.exports = {
  createOrUpdateFloorPrice,
  getFloorPrice,
  deleteFloorPrice,
  getFloorPricesForGift,
  allGiftsChart,
  getFloorPriceByModel,
};

const { Op } = require("sequelize");
const FloorPrice = require("../models/floor");
const { getAllGifts } = require("./giftServices");
const { FilteredData } = require("../models/filter");

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

async function getFloorPrice(gift_name, excludeModel = []) {
  try {
    const floorPrice = await FloorPrice.findOne({
      where: {
        gift_name,
        ...(excludeModel.length > 0
          ? { model: { [Op.not]: excludeModel } }
          : {}),
      },
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
    const filteedModels = await FilteredData.findAll({
      where: { gifts: gift_name },
      raw: true,
    }).then((res) => res.map((item) => item.models));

    const filteredDataFloors = {};
    const filteredDataPromises = filteedModels.map(async (model) => {
      const floors = await FloorPrice.findAll({
        where: { gift_name, model },
        order: [["last_updated", "ASC"]],
        raw: true,
      });

      filteredDataFloors[model] = floors;
    });

    await Promise.all(filteredDataPromises);

    const floorPrice = await FloorPrice.findAll({
      where: { gift_name, model: { [Op.notIn]: filteedModels } },
      order: [["last_updated", "ASC"]],
      raw: true,
    });

    const floorArray = [];

    if (!floorPrice) {
      return {
        floorPrice: [],
        minPrice: 0,
        currentPrice: 0,
        filteredData: [],
      };
    }

    const minPrice = await FloorPrice.min("price", { where: { gift_name } });
    const promises = floorPrice.map(async (fl, i) => {
      if (i > 0) {
        const prev = floorPrice[i - 1].price;
        const curr = fl.price;
        if (prev != curr) {
          floorArray.push({ price: curr });
        }
      } else floorArray.push({ price: fl.price });
    });

    await Promise.all(promises);

    return {
      floorPrice: floorArray,
      minPrice,
      currentPrice: floorArray.slice(-1)[0].price,
      filteredData: filteredDataFloors,
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

async function generateFloorPriceData() {
  try {
    const data = [];
    for (let i = 1; i <= 100; i++) {
      data.push({
        gift_name: `Vintage Cigar`,
        model: `Rudolph (3%)`,
        price: Math.floor(Math.random() * 100) + 1, // Random price between 1 and 1000
        last_updated: new Date(),
      });
    }

    await FloorPrice.bulkCreate(data);
    return { message: "100 floor price records generated successfully" };
  } catch (error) {
    console.error("Error generating floor price data:", error);
    throw error;
  }
}

module.exports = {
  createOrUpdateFloorPrice,
  getFloorPrice,
  deleteFloorPrice,
  getFloorPricesForGift,
  allGiftsChart,
  getFloorPriceByModel,
};

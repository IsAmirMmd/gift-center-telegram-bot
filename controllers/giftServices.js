const { Op } = require("sequelize");
const Gift = require("../models/gift");
const FloorPrice = require("../models/floor");
const { FilteredData } = require("../models/filter");

async function newGiftName(gift_name, models = []) {
  try {
    const gift = await Gift.findOne({
      where: { gift_name },
    });
    if (gift) {
      return updateModels(gift_name, models);
    }
    const newGift = await Gift.create({
      gift_name,
      gift_models: models.join("*"),
    });
    return newGift;
  } catch (error) {
    console.error("Error creating or updating floor price:", error);
    throw error;
  }
}

async function getGiftsModel(gift_name) {
  try {
    const gift = await Gift.findOne({
      where: { gift_name },
    });
    return gift;
  } catch (error) {
    console.error("Error gift:", error);
    throw error;
  }
}

async function getAllGifts() {
  try {
    const gift = await Gift.findAll({ raw: true });
    return gift;
  } catch (error) {
    console.error("Error gift:", error);
    throw error;
  }
}

async function updateModels(gift_name, models = []) {
  try {
    const gift = await Gift.findOne({
      where: { gift_name },
    });
    gift.gift_models = models.join("*");
    await gift.save();
    return gift;
  } catch (error) {
    console.error("Error User:", error);
    throw error;
  }
}

async function updateNotif(gift_name) {
  try {
    const gift = await Gift.findOne({
      where: { gift_name },
    });
    gift.checkFloor = !gift.checkFloor;
    await gift.save();
    return gift;
  } catch (error) {
    console.error("Error User:", error);
    throw error;
  }
}

async function updateFullCompare(gift_name) {
  try {
    const gift = await Gift.findOne({
      where: { gift_name },
    });
    gift.fullCompare = !gift.fullCompare;
    await gift.save();
    return gift;
  } catch (error) {
    console.error("Error User:", error);
    throw error;
  }
}

async function getByModel(model) {
  try {
    const gifts = await Gift.findAll({
      where: {
        gift_models: {
          [Op.like]: `%${model}%`,
        },
      },
    });
    return gifts;
  } catch (error) {
    console.error("Error User:", error);
    throw error;
  }
}

async function removeGift(gift_name) {
  try {
    const gift = await Gift.destroy({
      where: { gift_name },
    });
    const floors = await FloorPrice.destroy({
      where: { gift_name },
    });
    const filered = await FilteredData.destroy({
      where: { gifts: gift_name },
    });
  } catch (error) {
    console.error("Error User:", error);
    throw error;
  }
}

module.exports = {
  newGiftName,
  updateModels,
  getGiftsModel,
  getAllGifts,
  updateNotif,
  getByModel,
  removeGift,
  updateFullCompare,
};

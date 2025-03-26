const { Op } = require("sequelize");
const Gift = require("../models/gift");

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
    const gift = await Gift.findAll({});
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

module.exports = {
  newGiftName,
  updateModels,
  getGiftsModel,
  getAllGifts,
  updateNotif,
  getByModel,
};

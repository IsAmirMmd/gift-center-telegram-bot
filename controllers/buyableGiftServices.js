const { Op } = require("sequelize");
const Gift = require("../models/buyable_gifts");
const FloorPrice = require("../models/floor");
const { FilteredData } = require("../models/filter");

async function newGiftNameBuyable(gift_name) {
  try {
    const newGift = await Gift.create({ gift_name });
    return newGift;
  } catch (error) {
    console.error("Error creating or updating floor price:", error);
    throw error;
  }
}

async function getAllGiftsBuyable() {
  try {
    const gift = await Gift.findAll({ raw: true });
    return gift;
  } catch (error) {
    console.error("Error gift:", error);
    throw error;
  }
}

async function removeGiftBuyable(gift_name) {
  try {
    const gift = await Gift.destroy({
      where: { gift_name },
    });
  } catch (error) {
    console.error("Error User:", error);
    throw error;
  }
}

module.exports = {
  newGiftNameBuyable,
  getAllGiftsBuyable,
  removeGiftBuyable,
};

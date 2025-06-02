const Config = require("../models/auto_purchase");

async function newAutoPurchaseFilter(user_id) {
  try {
    const config = await Config.findOne({
      where: { user_id },
    });
    if (config) return config;

    const newGift = await Config.create({ user_id });
    return newGift;
  } catch (error) {
    console.error("Error creating or updating floor price:", error);
  }
}

async function getAllAutoPurchases(filter = {}) {
  try {
    const gift = await Config.findAll({
      where: filter,
      raw: true,
    });
    return gift;
  } catch (error) {
    console.error("Error gift:", error);
    throw error;
  }
}

async function removeAutoPurchases(user_id) {
  try {
    const gift = await Config.destroy({
      where: { user_id },
    });
  } catch (error) {
    console.error("Error User:", error);
    throw error;
  }
}

async function updateAutoPurchase(user_id, updateData) {
  try {
    const [updatedRows] = await Config.update(updateData, {
      where: { user_id },
    });
    return updatedRows;
  } catch (error) {
    console.error("Error updating auto purchase:", error);
    throw error;
  }
}

module.exports = {
  newAutoPurchaseFilter,
  getAllAutoPurchases,
  removeAutoPurchases,
  updateAutoPurchase,
};

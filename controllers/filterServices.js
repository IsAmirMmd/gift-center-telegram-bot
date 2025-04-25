const { FilteredData } = require("../models/filter");

// Service to create or update filtered data for a user
async function createOrUpdateFilteredData(user_id, key, value) {
  try {
    const newRecord = await FilteredData.create({
      user_id,
      [key]: value,
    });
    return newRecord;
  } catch (error) {
    console.error("Error in createOrUpdateFilteredData:", error);
    throw error;
  }
}

// Service to get filtered data for a specific user by user_id
async function getFilteredDataByUserId(user_id) {
  try {
    const filteredData = await FilteredData.findOne({
      where: { user_id },
    });
    return filteredData ?? null;
  } catch (error) {
    console.error("Error in getFilteredDataByUserId:", error);
    throw error;
  }
}

// Service to delete filtered data for a specific user by user_id
async function deleteFilteredDataByUserId(user_id) {
  try {
    const deletedRecord = await FilteredData.destroy({
      where: { user_id },
    });
    return deletedRecord;
  } catch (error) {
    console.error("Error in deleteFilteredDataByUserId:", error);
    throw error;
  }
}

// Service to get all filtered data records
async function getAllFilteredData() {
  try {
    const allFilteredData = await FilteredData.findAll({
      raw: true,
    });
    return allFilteredData;
  } catch (error) {
    console.error("Error in getAllFilteredData:", error);
    throw error;
  }
}

async function addAlert(gifts, models) {
  try {
    const fi = await FilteredData.create({
      gifts,
      models,
    });
    return fi;
  } catch (error) {
    console.error(error);
  }
}

async function deleteAlert(id) {
  try {
    return await FilteredData.destroy({ where: { id } });
  } catch (error) {
    console.error(error);
  }
}

module.exports = {
  createOrUpdateFilteredData,
  getFilteredDataByUserId,
  deleteFilteredDataByUserId,
  getAllFilteredData,
  addAlert,
  deleteAlert,
};

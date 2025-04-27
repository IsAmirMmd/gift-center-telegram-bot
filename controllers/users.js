const { GIFTSNAME } = require("../CONST");
const User = require("../models/user");

async function newUser(user_id, fullname, status) {
  try {
    const newUser = await User.create({
      user_id,
      fullname,
      status,
    });
    return newUser;
  } catch (error) {
    console.error("Error creating or updating floor price:", error);
    throw error;
  }
}

async function getUser(user_id) {
  try {
    const user = await User.findOne({
      where: { user_id },
    });

    return user;
  } catch (error) {
    console.error("Error User:", error);
    throw error;
  }
}

async function updateStatus(user_id, status) {
  try {
    const user = await User.findOne({
      where: { user_id },
    });
    user.status = status;
    await user.save();
    return user;
  } catch (error) {
    console.error("Error User:", error);
    throw error;
  }
}

async function getAdmins() {
  try {
    const admins = await User.findAll({
      where: { admin: true },
      raw: true,
    });
    return admins;
  } catch (error) {
    console.error("Error fetching admins:", error);
    throw error;
  }
}

async function isEditor(user_id) {
  try {
    const user = await User.findOne({
      where: { user_id },
    });
    if (user && user.role === "EDITOR") {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.error("Error checking editor status:", error);
    throw error;
  }
}

const demoteAdmin = async (user_id) => {
  const user = await getUser(user_id);
  user.admin = false;
  await user.save();
};

module.exports = {
  newUser,
  updateStatus,
  getUser,
  getAdmins,
  demoteAdmin,
  isEditor,
};

const tonPrice = async () => {
  try {
    const toncoinResponse = await fetch(
      "https://tonapi.io/v2/rates?tokens=ton&currencies=usd"
    );
    const tonData = await toncoinResponse.json();
    const tonPrice = tonData?.rates?.TON?.prices?.USD;
    return tonPrice ?? 99;
  } catch (error) {
    console.error("Error fetching TON price:", error);
    return 99;
  }
};

module.exports = {
  tonPrice,
};

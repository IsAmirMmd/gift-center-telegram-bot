function getRandomBarbieColors(opacity = 0.5) {
  const palette = [
    { r: 255, g: 105, b: 180 }, // Hot Pink
    { r: 255, g: 20, b: 147 }, // Deep Pink
    { r: 255, g: 182, b: 193 }, // Light Pink
    { r: 255, g: 192, b: 203 }, // Pink
    { r: 219, g: 112, b: 147 }, // Pale Violet Red
    { r: 255, g: 0, b: 255 }, // Magenta
    { r: 238, g: 130, b: 238 }, // Violet
    { r: 186, g: 85, b: 211 }, // Medium Orchid
    { r: 147, g: 112, b: 219 }, // Medium Purple
    { r: 138, g: 43, b: 226 }, // Blue Violet
    { r: 75, g: 0, b: 130 }, // Indigo
    { r: 199, g: 21, b: 133 }, // Medium Violet Red
    { r: 221, g: 160, b: 221 }, // Plum
    { r: 255, g: 228, b: 225 }, // Misty Rose
    { r: 250, g: 128, b: 114 }, // Salmon
    { r: 216, g: 191, b: 216 }, // Thistle
  ];

  const randomIndex = Math.floor(Math.random() * palette.length);
  const { r, g, b } = palette[randomIndex];

  const borderColor = `rgb(${r}, ${g}, ${b})`;
  const backgroundColor = `rgba(${r}, ${g}, ${b}, ${opacity})`;

  return { borderColor, backgroundColor };
}

const backgrounds = [
  "Ranger Green",
  "Strawberry",
  "Khaki Green",
  "Mystic Pearl",
  "Aquamarine",
  "Platinum",
  "Neon Blue",
  "Lavender",
  "Midnight Blue",
  "Dark Lilac",
  "Mexican Pink",
  "Seal Brown",
  "Onyx Black",
  "Navy Blue",
  "Sapphire",
  "French Blue",
  "Hunter Green",
  "Orange",
  "Cappuccino",
  "Burnt Sienna",
  "Pure Gold",
  "Amber",
  "Black",
  "Emerald",
  "Gunship Green",
  "Light Olive",
  "Coral Red",
  "Steel Grey",
  "Raspberry",
  "Camo Green",
  "Celtic Blue",
  "Jade Green",
  "Chocolate",
  "Persimmon",
  "Pacific Green",
  "Feldgrau",
  "Shamrock Green",
  "Mustard",
  "Fandango",
  "Cyberpunk",
  "Fire Engine",
  "English Violet",
  "Purple",
  "Azure Blue",
  "Caramel",
  "Mint Green",
  "Carmine",
  "Pistachio",
  "Sky Blue",
  "Carrot Juice",
  "Moonstone",
  "Turquoise",
  "Deep Cyan",
  "Tomato",
  "Tactical Pine",
  "Indigo Dye",
  "Electric Indigo",
  "Chestnut",
  "Battleship Grey",
  "Ivory White",
  "Old Gold",
  "Desert Sand",
  "Malachite",
  "Satin Gold",
  "Roman Silver",
  "Rifle Green",
  "Silver Blue",
  "Pine Green",
  "Lemongrass",
  "Electric Purple",
  "Rosewood",
  "Marine Blue",
  "Burgundy",
  "Grape",
  "French Violet",
  "Pacific Cyan",
  "Copper",
  "Cobalt Blue",
  "Gunmetal",
  "Dark Green",
];

module.exports = {
  getRandomBarbieColors,
  backgrounds,
};

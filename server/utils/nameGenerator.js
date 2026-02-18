const adjectives = [
  'Swift', 'Bold', 'Calm', 'Witty', 'Bright',
  'Eager', 'Fuzzy', 'Jolly', 'Lively', 'Mellow',
  'Noble', 'Peppy', 'Quirky', 'Rustic', 'Snappy',
  'Tidy', 'Upbeat', 'Vivid', 'Warm', 'Zesty',
];

const animals = [
  'Otter', 'Falcon', 'Panda', 'Koala', 'Lynx',
  'Mango', 'Narwhal', 'Osprey', 'Penguin', 'Quokka',
  'Raccoon', 'Sloth', 'Toucan', 'Uakari', 'Viper',
  'Walrus', 'Xerus', 'Yak', 'Zebu', 'Axolotl',
];

const colors = [
  '#e74c3c', '#e67e22', '#f1c40f', '#2ecc71', '#1abc9c',
  '#3498db', '#9b59b6', '#e91e63', '#00bcd4', '#ff5722',
  '#607d8b', '#795548', '#4caf50', '#ff9800', '#673ab7',
];

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateUser() {
  return {
    username: `${randomItem(adjectives)}${randomItem(animals)}`,
    color: randomItem(colors),
  };
}

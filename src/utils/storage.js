export function getStorage(key, defaultValue = []) {
  const savedData = localStorage.getItem(key);

  if (!savedData) {
    return defaultValue;
  }

  try {
    return JSON.parse(savedData);
  } catch (error) {
    console.error(
      `Failed to parse localStorage key: ${key}`,
      error
    );

    return defaultValue;
  }
}


export function setStorage(key, value) {
  localStorage.setItem(
    key,
    JSON.stringify(value)
  );
}
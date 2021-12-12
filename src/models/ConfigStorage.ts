import {SHConConfig} from './SHConConfig';

export interface ConfigStorageIndex {
  readonly id: number;
  readonly label: string;
  readonly createdAt: number;
}

function getLocalStorage(): Storage {
  if (!window?.localStorage) {
    throw new Error('ローカルストレージに未対応のブラウザです。');
  }
  return window.localStorage;
}

const configIndexesKey = 'SH-Config-Indexes';

function configKey(id: number): string {
  return `SH-Config-${id}`;
}

export function loadConfigIndexes(): ConfigStorageIndex[] {
  let storage: Storage;
  try {
    storage = getLocalStorage();
  } catch {
    return [];
  }

  const indexesData = storage.getItem(configIndexesKey);
  if (!indexesData) {
    return [];
  }
  return JSON.parse(indexesData);
}

export function loadConfig(id: number): SHConConfig {
  const storage = getLocalStorage();
  const data = storage.getItem(configKey(id));
  if (!data) {
    throw new Error('データが読みだせませんでした。');
  }
  return JSON.parse(data);
}

export function saveConfig(id: number, label: string, createdAt: number, config: SHConConfig): void {
  const storage = getLocalStorage();
  const currentIndexes = loadConfigIndexes();
  const currentIndexesIndex = currentIndexes.findIndex((index) => index.id === id);
  if (currentIndexesIndex < 0) {
    currentIndexes.push({id, label, createdAt});
    storage.setItem(configIndexesKey, JSON.stringify(currentIndexes));
  } else if (label !== currentIndexes[currentIndexesIndex].label) {
    currentIndexes[currentIndexesIndex] = {...currentIndexes[currentIndexesIndex], label};
    storage.setItem(configIndexesKey, JSON.stringify(currentIndexes));
  }
  storage.setItem(configKey(id), JSON.stringify(config));
}

export function deleteConfig(id: number): ConfigStorageIndex[] {
  const storage = getLocalStorage();
  const currentIndexes = loadConfigIndexes();
  const updatedIndexes = currentIndexes.filter((index) => index.id !== id);
  storage.setItem(configIndexesKey, JSON.stringify(updatedIndexes));
  storage.removeItem(configKey(id));
  return updatedIndexes;
}

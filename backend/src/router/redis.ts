import Redis from 'ioredis';

export const getRedis = () =>
  new Redis({
    host: 'redis',
    retryStrategy(times): number {
      return Math.max(times * 100, 3000);
    },
});

const cacheRedis = getRedis();

export const setExpireDataInRedis = async (
  key: string,
  value: string,
  seconds = 60*60,
): Promise<string> => {
  return await cacheRedis.set(key, value, 'EX', seconds);
};

export const getCachedDataInRedis = async (key: string): Promise<string | null> =>
  await cacheRedis.get(key);

export const setVaultDataRedis = async (key, data): Promise<string> =>
  setExpireDataInRedis(key, JSON.stringify(data));

export const getVaultDataRedis = async (key): Promise<any> => {
  const vaultDataCachedStr = await getCachedDataInRedis(key);
  if (vaultDataCachedStr) {
    return JSON.parse(vaultDataCachedStr);
  }
  return null;
};
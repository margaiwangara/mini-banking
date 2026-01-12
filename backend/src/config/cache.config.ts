import { CacheModuleOptions } from '@nestjs/cache-manager';

export const cacheConfig: CacheModuleOptions = {
  isGlobal: true,
  // Use in-memory cache by default
  // To use Redis, install cache-manager-redis-store and configure:
  // store: redisStore as any,
  ttl: 300, // 5 minutes default TTL
};

import type { SyncProvider } from './SyncProvider';

export const noopSync: SyncProvider = {
  name: 'local',
  isConfigured: () => false,
  push: async () => {},
  pull: async () => []
};

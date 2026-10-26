import type { MediaItem } from '../../types/media';

/** Contrato de sincronização na nuvem. Troque a implementação sem mexer na UI. */
export interface SyncProvider {
  readonly name: string;
  isConfigured(): boolean;
  /** Envia os itens locais e devolve a lista remota completa. */
  push(items: MediaItem[]): Promise<void>;
  pull(): Promise<MediaItem[]>;
}

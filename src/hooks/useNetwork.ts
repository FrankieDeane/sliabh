import { useNetworkStore } from '../store/networkStore';

export function useNetwork() {
  const { isOnline } = useNetworkStore();
  return { isOnline, isOffline: !isOnline };
}

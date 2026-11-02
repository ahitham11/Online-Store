import { useNetworkState } from 'expo-network';

/**
 * Connectivity is only used to explain a failed request; the catalog is
 * always served from its own cache first. `null` means the platform has not
 * reported a value yet and is treated as online to avoid a false banner.
 */
export function useNetworkStatus() {
  const state = useNetworkState();
  const offline =
    state.isConnected === false ||
    state.isInternetReachable === false;
  return { state, offline };
}

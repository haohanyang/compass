import { useSelector } from '../stores/store-context';
import type { ConnectionState } from '../stores/connections-store-redux';

type ConnectionFeature = 'rollingIndexCreation' | 'globalWrites';

function isFreeOrSharedTierCluster(instanceSize: string | undefined): boolean {
  if (!instanceSize) {
    return false;
  }

  return ['M0', 'M2', 'M5'].includes(instanceSize);
}

function supportsRollingIndexCreation(connection: ConnectionState) {
  const atlasMetadata = connection.info?.atlasMetadata;

  if (!atlasMetadata) {
    return false;
  }

  const { metricsType, instanceSize } = atlasMetadata;
  return (
    !isFreeOrSharedTierCluster(instanceSize) &&
    (metricsType === 'cluster' || metricsType === 'replicaSet')
  );
}

function supportsGlobalWrites(connection: ConnectionState) {
  const atlasMetadata = connection.info?.atlasMetadata;

  if (!atlasMetadata) {
    return false;
  }

  return atlasMetadata.clusterType === 'GEOSHARDED';
}

export function useConnectionSupports(
  connectionId: string,
  connectionFeature: ConnectionFeature
): boolean {
  return useSelector((state) => {
    const connection = state.connections.byId[connectionId];

    if (!connection) {
      return false;
    }

    if (connectionFeature === 'rollingIndexCreation') {
      return supportsRollingIndexCreation(connection);
    }

    if (connectionFeature === 'globalWrites') {
      return supportsGlobalWrites(connection);
    }

    return false;
  });
}
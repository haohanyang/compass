import React, { useRef } from 'react';
import { AppRegistryProvider } from 'hadron-app-registry';
import { defaultPreferencesInstance } from 'compass-preferences-model';
import { PreferencesProvider } from 'compass-preferences-model/provider';
import { CompassAtlasAuthService } from '@mongodb-js/atlas-service/renderer';
import {
  AtlasAuthServiceProvider,
  AtlasServiceProvider,
} from '@mongodb-js/atlas-service/provider';
import { AtlasAiServiceProvider } from '@mongodb-js/compass-generative-ai/provider';
import {
  CompassFavoriteQueryStorage,
  CompassPipelineStorage,
  CompassRecentQueryStorage,
} from '@mongodb-js/my-queries-storage';
import {
  PipelineStorageProvider,
  FavoriteQueryStorageProvider,
  RecentQueryStorageProvider,
  type FavoriteQueryStorageAccess,
  type RecentQueryStorageAccess,
} from '@mongodb-js/my-queries-storage/provider';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
import { LoggerAndTelemetryProvider } from '@mongodb-js/compass-logging/provider';
import { getAppName, getAppVersion } from '@mongodb-js/compass-utils';
import Home, { type HomeProps } from './home';

const WithPreferencesAndLoggerProviders: React.FC = ({ children }) => {
  const loggerProviderValue = useRef({
    createLogger: createLoggerAndTelemetry,
    preferences: defaultPreferencesInstance,
  });
  return (
    <PreferencesProvider value={loggerProviderValue.current.preferences}>
      <LoggerAndTelemetryProvider value={loggerProviderValue.current}>
        {children}
      </LoggerAndTelemetryProvider>
    </PreferencesProvider>
  );
};

export const WithAtlasProviders: React.FC = ({ children }) => {
  const authService = useRef(new CompassAtlasAuthService());
  return (
    <AtlasAuthServiceProvider value={authService.current}>
      <AtlasServiceProvider
        options={{
          defaultHeaders: {
            'User-Agent': `${getAppName()}/${getAppVersion()}`,
          },
        }}
      >
        <AtlasAiServiceProvider>{children}</AtlasAiServiceProvider>
      </AtlasServiceProvider>
    </AtlasAuthServiceProvider>
  );
};

export const WithStorageProviders: React.FC = ({ children }) => {
  const pipelineStorage = useRef(new CompassPipelineStorage());
  const favoriteQueryStorage = useRef<FavoriteQueryStorageAccess>({
    getStorage(options) {
      return new CompassFavoriteQueryStorage(options);
    },
  });
  const recentQueryStorage = useRef<RecentQueryStorageAccess>({
    getStorage(options) {
      return new CompassRecentQueryStorage(options);
    },
  });
  return (
    <PipelineStorageProvider value={pipelineStorage.current}>
      <FavoriteQueryStorageProvider value={favoriteQueryStorage.current}>
        <RecentQueryStorageProvider value={recentQueryStorage.current}>
          {children}
        </RecentQueryStorageProvider>
      </FavoriteQueryStorageProvider>
    </PipelineStorageProvider>
  );
};

export const CompassElectron = (
  props: Omit<
    HomeProps,
    '__TEST_MONGODB_DATA_SERVICE_CONNECT_FN' | '__TEST_INITIAL_CONNECTION_INFO'
  >
) => {
  return (
    <WithPreferencesAndLoggerProviders>
      <WithAtlasProviders>
        <WithStorageProviders>
          <AppRegistryProvider scopeName="Application Root">
            <Home {...props} />
          </AppRegistryProvider>
        </WithStorageProviders>
      </WithAtlasProviders>
    </WithPreferencesAndLoggerProviders>
  );
};
import type { Action, Reducer } from 'redux';
import { abort, getAbortSignal, isAction } from './utils';
import type { AtlasUserInfo } from '@mongodb-js/atlas-service/renderer';
import type { SettingsThunkAction } from '.';

type AtlasLoginSettingsState = { attemptId: number | null } & (
  | {
      status: 'initial' | 'in-progress' | 'unauthenticated';
      userInfo: null;
    }
  | { status: 'authenticated'; userInfo: AtlasUserInfo }
);

const INITIAL_STATE = {
  status: 'initial' as const,
  attemptId: null,
  userInfo: null,
};

const enum AtlasLoginSettingsActionTypes {
  SignInStart = 'compass-settings/atlas-login/SignInStart',
  SignInSuccess = 'compass-settings/atlas-login/SignInSuccess',
  SignInError = 'compass-settings/atlas-login/SignInError',
  SignOut = 'compass-settings/atlas-login/SignOut',
  GetUserInfoStart = 'compass-settings/atlas-login/GetUserInfoStart',
  GetUserInfoSuccess = 'compass-settings/atlas-login/GetUserInfoSuccess',
  GetUserInfoError = 'compass-settings/atlas-login/GetUserInfoError',
  CancelAttempt = 'compass-settings/atlas-login/CancelAttempt',
  AtlasServiceTokenRefreshFailed = 'compass-settings/atlas-login/AtlasServiceTokenRefreshFailed',
  AtlasServiceSignedOut = 'compass-settings/atlas-login/AtlasServiceSignOut',
}

type SignInStartAction = {
  type: AtlasLoginSettingsActionTypes.SignInStart;
  attemptId: number;
};

type SignInSuccessAction = {
  type: AtlasLoginSettingsActionTypes.SignInSuccess;
  userInfo: AtlasUserInfo;
};

type SignInErrorAction = {
  type: AtlasLoginSettingsActionTypes.SignInError;
  error: string;
};

type GetUserInfoStartAction = {
  type: AtlasLoginSettingsActionTypes.GetUserInfoStart;
};

type GetUserInfoSuccessAction = {
  type: AtlasLoginSettingsActionTypes.GetUserInfoSuccess;
  userInfo: AtlasUserInfo;
};

type GetUserInfoErrorAction = {
  type: AtlasLoginSettingsActionTypes.GetUserInfoError;
  error: string;
};

type SignOutAction = {
  type: AtlasLoginSettingsActionTypes.SignOut;
};

type AtlasServiceCancelAttemptAction = {
  type: AtlasLoginSettingsActionTypes.CancelAttempt;
};

type AtlasServiceTokenRefreshFailedAction = {
  type: AtlasLoginSettingsActionTypes.AtlasServiceTokenRefreshFailed;
};

type AtlasServiceSignedOutAction = {
  type: AtlasLoginSettingsActionTypes.AtlasServiceSignedOut;
};

const reducer: Reducer<AtlasLoginSettingsState, Action> = (
  state = INITIAL_STATE,
  action
) => {
  if (
    isAction<SignInStartAction>(
      action,
      AtlasLoginSettingsActionTypes.SignInStart
    )
  ) {
    return {
      status: 'in-progress',
      attemptId: action.attemptId,
      userInfo: null,
    };
  }

  if (
    isAction<GetUserInfoStartAction>(
      action,
      AtlasLoginSettingsActionTypes.GetUserInfoStart
    )
  ) {
    return {
      ...state,
      status: 'in-progress',
      userInfo: null,
    };
  }

  if (
    isAction<SignInSuccessAction>(
      action,
      AtlasLoginSettingsActionTypes.SignInSuccess
    ) ||
    isAction<GetUserInfoSuccessAction>(
      action,
      AtlasLoginSettingsActionTypes.GetUserInfoSuccess
    )
  ) {
    return {
      ...state,
      status: 'authenticated',
      userInfo: action.userInfo,
      attemptId: null,
    };
  }

  if (
    isAction<SignOutAction>(action, AtlasLoginSettingsActionTypes.SignOut) ||
    isAction<SignInErrorAction>(
      action,
      AtlasLoginSettingsActionTypes.SignInError
    ) ||
    isAction<GetUserInfoErrorAction>(
      action,
      AtlasLoginSettingsActionTypes.GetUserInfoError
    ) ||
    isAction<AtlasServiceSignedOutAction>(
      action,
      AtlasLoginSettingsActionTypes.AtlasServiceSignedOut
    ) ||
    isAction<AtlasServiceTokenRefreshFailedAction>(
      action,
      AtlasLoginSettingsActionTypes.AtlasServiceTokenRefreshFailed
    ) ||
    isAction<AtlasServiceCancelAttemptAction>(
      action,
      AtlasLoginSettingsActionTypes.CancelAttempt
    )
  ) {
    return {
      ...state,
      status: 'unauthenticated',
      userInfo: null,
    };
  }

  return state;
};

export const signIn = (): SettingsThunkAction<Promise<void>> => {
  return async (dispatch, getState, { atlasAuthService }) => {
    if (
      ['in-progress', 'authenticated'].includes(getState().atlasLogin.status)
    ) {
      return;
    }
    const { signal, id } = getAbortSignal();
    try {
      dispatch({
        type: AtlasLoginSettingsActionTypes.SignInStart,
        attemptId: id,
      });
      const userInfo = await atlasAuthService.signIn({
        signal,
      });
      dispatch({ type: AtlasLoginSettingsActionTypes.SignInSuccess, userInfo });
    } catch (err) {
      if (signal?.aborted) {
        return;
      }
      dispatch({
        type: AtlasLoginSettingsActionTypes.SignInError,
        error: (err as Error).message,
      });
    }
  };
};

export const getUserInfo = (): SettingsThunkAction<Promise<void>> => {
  return async (dispatch, getState, { atlasAuthService }) => {
    if (
      ['in-progress', 'authenticated'].includes(getState().atlasLogin.status)
    ) {
      return;
    }
    try {
      dispatch({ type: AtlasLoginSettingsActionTypes.GetUserInfoStart });
      const userInfo = await atlasAuthService.getUserInfo();
      dispatch({
        type: AtlasLoginSettingsActionTypes.GetUserInfoSuccess,
        userInfo,
      });
    } catch (err) {
      dispatch({
        type: AtlasLoginSettingsActionTypes.GetUserInfoError,
        error: (err as Error).message,
      });
    }
  };
};

export const signOut = (): SettingsThunkAction<Promise<void>> => {
  return async (dispatch, _getState, { atlasAuthService }) => {
    await atlasAuthService.signOut();
    dispatch({ type: AtlasLoginSettingsActionTypes.SignOut });
  };
};

export const atlasServiceSignedOut = () => {
  return {
    type: AtlasLoginSettingsActionTypes.AtlasServiceSignedOut,
  };
};

export const atlasServiceTokenRefreshFailed = () => {
  return {
    type: AtlasLoginSettingsActionTypes.AtlasServiceTokenRefreshFailed,
  };
};

export const cancelAtlasLoginAttempt = (): SettingsThunkAction<void> => {
  return (dispatch, getState) => {
    const { attemptId } = getState().atlasLogin;
    if (attemptId === null) {
      return;
    }
    abort(attemptId);
    dispatch({ type: AtlasLoginSettingsActionTypes.CancelAttempt });
  };
};

export default reducer;

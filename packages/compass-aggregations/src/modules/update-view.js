import toNS from 'mongodb-ns';
const debug = require('debug')('mongodb-aggregations:modules:update-view');
import {
  globalAppRegistryEmit
} from 'mongodb-redux-common/app-registry';

import { generateStage } from './stage';

/**
 * State `null` when there is no error, or string if there's an error.
 */
export const INITIAL_STATE = null;

// Action for when an error occurs when updating a view.
export const ERROR_UPDATING_VIEW = 'aggregations/update-view/ERROR_UPDATING_VIEW';

// Action for dismissing the error that occured when updating a view.
export const DISMISS_VIEW_UPDATE_ERROR = 'aggregations/update-view/DISMISS_VIEW_UPDATE_ERROR';

export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === ERROR_UPDATING_VIEW) {
    return action.error;
  }
  if (action.type === DISMISS_VIEW_UPDATE_ERROR) {
    return null;
  }
  return state;
}

/**
 * Action creator for showing the error that occured with updating the view.
 *
 * @param {Error} error - The updating view error.
 *
 * @returns {Object} The action.
 */
export const updateViewErrorOccured = (error) => ({
  type: ERROR_UPDATING_VIEW,
  error: `${error}`
});

/**
 * Action creator for dismissing any error that occured with updating the view.
 *
 * @returns {Object} The action.
 */
export const dismissViewError = () => ({
  type: DISMISS_VIEW_UPDATE_ERROR
});

/**
 * Updates a view.
 *
 * @returns {Function} The function.
 */
export const updateView = () => {
  return (dispatch, getState) => {
    dispatch(dismissViewError());

    const state = getState();
    const ds = state.dataService.dataService;
    const viewNamespace = state.editViewName;
    const viewPipeline = state.pipeline.map((p) => (p.executor || generateStage(p)));
    const options = {
      viewOn: toNS(state.namespace).collection,
      pipeline: viewPipeline
    };

    try {
      debug('calling data-service.updateCollection', viewNamespace);
      ds.updateCollection(viewNamespace, options, (e) => {
        if (e) {
          debug('error updating view', e);
          dispatch(updateViewErrorOccured(e));
          return;
        }

        dispatch(globalAppRegistryEmit('refresh-data'));
        dispatch(
          globalAppRegistryEmit(
            'compass:aggregations:update-view',
            { numStages: viewPipeline.length }
          )
        );
        const metadata = {
          namespace: viewNamespace,
          isReadonly: true,
          sourceName: state.namespace,
          editViewName: null,
          isSourceReadonly: state.isReadonly,
          sourceViewOn: state.sourceName,
          sourcePipeline: viewPipeline
        };
        debug('selecting namespace', metadata);
        dispatch(globalAppRegistryEmit('select-namespace', metadata));
      });
    } catch (e) {
      debug('Unexpected error updating view', e);
      dispatch(updateViewErrorOccured(e));
    }
  };
};

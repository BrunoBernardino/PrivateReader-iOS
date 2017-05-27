import data from './utils/data';

const actions = {
  fetchRSSFeeds: (loadArticles, callback) => {
    return (dispatch) => {
      dispatch({ type: 'LOAD_FEEDS' });
      return data.reloadRSSFeeds()
        .then((feeds) => {
          dispatch({ type: 'LOAD_FEEDS_DONE', feeds });
          if (loadArticles) {
            dispatch(actions.fetchArticles(callback));
          } else {
            if (callback) {
              callback();
            }
          }
        })
        .catch(dispatch({ type: 'LOAD_FEEDS_FAIL' }));
    };
  },

  fetchArticles: (callback) => {
    return (dispatch, getState) => {
      dispatch({ type: 'LOAD_ARTICLES' });

      const { rssFeeds } = getState();

      return data.reloadArticles(rssFeeds)
        .then((articles) => {
          dispatch({ type: 'LOAD_ARTICLES_DONE', articles });
          if (callback) {
            callback();
          }
        })
        .catch(dispatch({ type: 'LOAD_ARTICLES_FAIL' }));
    };
  },

  fetchSavedArticles: () => {
    return (dispatch) => {
      dispatch({ type: 'LOAD_SAVED' });
      return data.reloadSavedArticles()
        .then((articles) => {
          dispatch({ type: 'LOAD_SAVED_DONE', articles });
        })
        .catch(dispatch({ type: 'LOAD_SAVED_FAIL' }));
    };
  },

  fetchArchivedArticles: () => {
    return (dispatch) => {
      dispatch({ type: 'LOAD_ARCHIVED' });
      return data.reloadArchivedArticles()
        .then((articles) => {
          dispatch({ type: 'LOAD_ARCHIVED_DONE', articles });
        })
        .catch(dispatch({ type: 'LOAD_ARCHIVED_FAIL' }));
    };
  },
};

export default actions;

const reducer = (state, action) => {
  if (typeof state === 'undefined') {
    return {
      rssFeeds: [],
      unreadArticles: [],
      savedArticles: [],
      archivedArticles: [],
      isLoadingFeeds: false,
      isLoadingArticles: false,
      isLoadingSaved: false,
      isLoadingArchived: false,
    };
  }

  if (action.type === 'LOAD_FEEDS') {
    return {
      ...state,
      'isLoadingFeeds': true,
    };
  }

  if (action.type === 'LOAD_FEEDS_DONE') {
    return {
      ...state,
      'isLoadingFeeds': false,
      'rssFeeds': action.feeds,
    };
  }

  if (action.type === 'LOAD_FEEDS_FAIL') {
    return {
      ...state,
      'isLoadingFeeds': false,
    };
  }

  if (action.type === 'LOAD_ARTICLES') {
    return {
      ...state,
      'isLoadingArticles': true,
    };
  }

  if (action.type === 'LOAD_ARTICLES_DONE') {
    return {
      ...state,
      'isLoadingArticles': false,
      'unreadArticles': action.articles,
    };
  }

  if (action.type === 'LOAD_ARTICLES_FAIL') {
    return {
      ...state,
      'isLoadingArticles': false,
    };
  }

  if (action.type === 'LOAD_SAVED') {
    return {
      ...state,
      'isLoadingSaved': true,
    };
  }

  if (action.type === 'LOAD_SAVED_DONE') {
    return {
      ...state,
      'isLoadingSaved': false,
      'savedArticles': action.articles,
    };
  }

  if (action.type === 'LOAD_SAVED_FAIL') {
    return {
      ...state,
      'isLoadingSaved': false,
    };
  }

  if (action.type === 'LOAD_ARCHIVED') {
    return {
      ...state,
      'isLoadingArchived': true,
    };
  }

  if (action.type === 'LOAD_ARCHIVED_DONE') {
    return {
      ...state,
      'isLoadingArchived': false,
      'archivedArticles': action.articles,
    };
  }

  if (action.type === 'LOAD_ARCHIVED_FAIL') {
    return {
      ...state,
      'isLoadingArchived': false,
    };
  }

  return state;
};

export default reducer;

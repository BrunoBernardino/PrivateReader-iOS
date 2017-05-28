import async from 'async';
import { NativeModules } from 'react-native';
import feeds from './feeds';

const DataManager = NativeModules.DataManager;
const iCloudDocuments = NativeModules.ICloudDocuments;

let hasSetup = false;

export const domParserOptions = {
  errorHandler: (/*level, msg*/) => {
    //console.log(`### DOM PARSER ${level} ###`);
    //console.log(msg);
  },
};

const data = {
  init: () => {
    DataManager.hasSetup((result) => {
      if (result.success) {
        hasSetup = result.hasSetup;
      }
    });
  },

  reloadRSSFeeds: () => {
    return new Promise((resolve, reject) => {
      DataManager.get('RSSFeeds', (result) => {
        if (result.success) {
          resolve(result.feeds);
        } else {
          reject();
        }
      });
    });
  },

  reloadArticles: (rssFeeds) => {
    return new Promise((resolve, reject) => {
      try {
        feeds.fetchNewUnreadArticles(rssFeeds, resolve);
      } catch (e) {
        reject(e);
      }
    });
  },

  reloadSavedArticles: () => {
    return new Promise((resolve, reject) => {
      DataManager.get('SavedURLs', (result) => {
        if (result.success) {
          resolve(result.urls);
        } else {
          reject();
        }
      });
    });
  },

  reloadArchivedArticles: () => {
    return new Promise((resolve, reject) => {
      DataManager.get('ArchivedURLs', (result) => {
        if (result.success) {
          resolve(result.urls);
        } else {
          reject();
        }
      });
    });
  },

  setSetup: (newValue) => (DataManager.setSetup(newValue)),

  hasSetup: () => (hasSetup),

  markArticleAsRead: (articleId, feedURL, callback) => {
    DataManager.markArticleAsRead(articleId, feedURL, () => {
      // This is triggered too quickly
      setTimeout(callback, 500);
    });
  },

  addSavedArticle: (article, callback) => {
    DataManager.addURL('SavedURL', article.url, article.title, (article.image || ''), article.body, callback);
  },

  addArchivedArticle: (article, callback) => {
    DataManager.addURL('ArchivedURL', article.url, article.title, (article.image || ''), article.body, callback);
  },

  removeSavedArticle: (articleURL, callback) => {
    DataManager.removeURL('SavedURL', articleURL, callback);
  },

  removeArchivedArticle: (articleURL, callback) => {
    DataManager.removeURL('ArchivedURL', articleURL, callback);
  },

  addRSSFeed: (feed, callback) => {
    DataManager.addFeed(feed.url, feed.title, callback);
  },

  removeRSSFeed: (feedURL, callback) => {
    DataManager.removeFeed(feedURL, callback);
  },

  removeAllData: (callback) => {
    DataManager.removeAllData(callback);
  },

  exportData: (rssFeeds, savedArticles, archivedArticles, callback) => {
    // TODO: Build OMPL and HTML files, send them along
    const opmlFileContents = '<test><opml /></test>\n';
    const htmlFileContents = '<test><html /></test>\n';

    DataManager.exportData(opmlFileContents, htmlFileContents, (result) => {
      async.eachSeries(result.filePaths, (filePath, moveCallback) => {
        // console.log(filePath);
        iCloudDocuments.moveFileToICloud(filePath, moveCallback);
      }, callback);
    });
  },

  importData: (type, fileURL, callback) => {
    // TODO: Really read, parse, and import the file
    console.log('### FILE URL ###');
    console.log(type);
    console.log(fileURL);
    callback();
  },
};

export default data;

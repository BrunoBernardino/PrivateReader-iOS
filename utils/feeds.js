/* globals fetch */

import _ from 'lodash';
import async from 'async';
import { DOMParser } from 'xmldom';
import React from 'react';
import {
  StyleSheet,
  Image,
  Text,
  TouchableOpacity,
  ListView,
  TouchableHighlight,
  View,
} from 'react-native';
import Modal from 'react-native-modalbox';

import assets from './assets';
import articles, { stripTags, getImageFromContent } from './articles';
import { domParserOptions } from './data';

// Safely (without duplicate slashes, etc.) adds a baseURL to a url path
const safelyAddBaseURL = (url, baseURL) => {
  url = `${baseURL}/${url}`.replace(/\/\//g, '/').replace(':/','‌​://'); // Remove duplicate slashes and add back for protocol

  // For some reason weird invisible characters get added, so we remove them
  const encoded = encodeURIComponent(url);
  const replaced = encoded.replace(/(https?).*(%3A%2F%2F)(.*)/, '$1$2$3');
  url = decodeURIComponent(replaced);

  return url;
};

// Get URL and Title from an Atom XML Feed
const getURLAndTitleFromAtomXML = (text, feedURL) => {
  try {
    const doc = new DOMParser(domParserOptions).parseFromString(text, 'text/html');
    const titles = doc.getElementsByTagName('title');
    const feedTitle = _.get(titles, [0, 'textContent'], '');
    // const feedURL = _.get(doc.getElementsByTagName('link'), [0, 'textContent'], '');
    // const feedAtom10URL = _.get(doc.getElementsByTagName('atom10:link'), [0], {getAttribute:() => null}).getAttribute('href') || '';

    // try to access 1 entry, to validate this is an atom feed
    const firstEntry = _.get(doc.getElementsByTagName('entry'), [0, 'textContent'], '');
    if (!firstEntry) {
      throw new Error('Could not find an entry.');
    }

    const feed = {
      title: feedTitle,
      url: /*feedAtom10URL || */feedURL,
    };

    return feed;
  } catch(e) {
    // console.log('Failed for atom XML');
    // console.log(e);
    return null;
  }
};

// Get URL and Title from an RSS XML Feed
const getURLAndTitleFromXML = (text, feedURL) => {
  try {
    const doc = new DOMParser(domParserOptions).parseFromString(text, 'text/html');
    const channels = doc.getElementsByTagName('channel');
    const feedTitle = _.get(channels[0].getElementsByTagName('title'), [0, 'textContent'], '');
    // const feedURL = _.get(channels[0].getElementsByTagName('link'), [0, 'textContent'], '');
    // const feedAtom10URL = _.get(channels[0].getElementsByTagName('atom10:link'), [0], {getAttribute:() => null}).getAttribute('href') || '';
    // let feedAtomURL = _.get(channels[0].getElementsByTagName('atom:link'), [0], {getAttribute:() => null}).getAttribute('href') || '';

    // TODO: While the feed is broken
    /*if (feedAtomURL === 'http://duke.questionablecontent.net/QCRSS.xml') {
      feedAtomURL = 'https://questionablecontent.net/QCRSS.xml';
    }*/

    // try to access 1 item, to validate this is an RSS feed
    const firstItem = _.get(doc.getElementsByTagName('item'), [0, 'textContent'], '');
    if (!firstItem) {
      throw new Error('Could not find an item.');
    }

    const feed = {
      title: feedTitle,
      url: /*feedAtom10URL || feedAtomURL || */feedURL,
    };

    return feed;
  } catch(e) {
    // console.log('Failed for RSS XML');
    // console.log(e);
    return getURLAndTitleFromAtomXML(text, feedURL);
  }
};

// Parse a feed from HTML, if necessary
const parseFeedFromHTML = (responseText, feedURL, callback) => {
  const rssFeed = getURLAndTitleFromXML(responseText, feedURL);

  if (rssFeed && rssFeed.url && rssFeed.title) {
    return callback(null, rssFeed);
  }

  // If we're here, something failed, so we'll try to find a feed in the link tags
  try {
    const doc = new DOMParser(domParserOptions).parseFromString(responseText, 'text/html');

    let foundFeed = false;

    _.each(doc.getElementsByTagName('link'), (link) => {
      // Skip if found
      if (foundFeed || !link) {
        return;
      }

      const linkRel = link.getAttribute('rel') || '';
      const linkType = link.getAttribute('type') || '';
      let linkHref = link.getAttribute('href') || '';

      if (linkRel === 'alternate' && (linkType === 'application/rss+xml' || linkType === 'application/atom+xml') && linkHref) {
        foundFeed = true;

        // Add feedURL if not included (acts as baseURL here)
        if (linkHref.indexOf('http') === -1) {
          linkHref = safelyAddBaseURL(linkHref, feedURL);
        }

        fetch(linkHref)
          .then((response) => response.text())
          .then((linkResponseText) => {
            callback(null, getURLAndTitleFromXML(linkResponseText, linkHref));
          })
          .catch(callback);
      }
    });

    if (!foundFeed) {
      callback('Feed reference not found/identified inside HTML document.');
    }
  } catch(e) {
    callback('Feed not found for URL.');
  }
};

const ALLOWED_HTML_TAGS = [
  '<a>',
  '<b>',
  '<p>',
  '<br>',
  '<strong>',
  '<img>',
  '<em>',
  '<hr>',
].join('');

// Parse an article from an RSS Feed
const parseArticleFromXML = (responseText, unreadArticles, latestReadId, feedURL, callback) => {
  const doc = new DOMParser(domParserOptions).parseFromString(responseText, 'text/html');

  let items = doc.getElementsByTagName('item');

  // Try atom format, if nothing was found
  if (items.length === 0) {
    items = doc.getElementsByTagName('entry');
  }

  let latestReadIndex;

  // Find the latestReadId
  _.each(items, (item, index) => {
    // Skip if we've found it
    if (typeof latestReadIndex !== 'undefined') {
      return;
    }

    let id = _.get(item.getElementsByTagName('guid'), [0, 'textContent'], '');

    // Try atom format, if nothing was found
    if (id === '') {
      id = _.get(item.getElementsByTagName('id'), [0, 'textContent'], '');
    }

    // We'll also consider anything past 20 items as read (too much stuff!)
    if (id === latestReadId || index >= 19) {
      latestReadIndex = index;
    }
  });

  async.eachOf(items, (item, index, articleCallback) => {
    // Check if the item is past latestReadId
    if (typeof latestReadIndex !== 'undefined' && index >= latestReadIndex) {
      return articleCallback();
    }

    const htmlContent = _.get(item.getElementsByTagName('description'), [0, 'textContent'], '') ||
      _.get(item.getElementsByTagName('content:encoded'), [0, 'textContent'], '') ||
      _.get(item.getElementsByTagName('content'), [0, 'textContent'], '') ||
      _.get(item.getElementsByTagName('summary'), [0, 'textContent'], '') ||
      'No content.';

    const cleanedHTMLContent = stripTags(htmlContent, ALLOWED_HTML_TAGS);

    let articleId = _.get(item.getElementsByTagName('guid'), [0, 'textContent'], '');
    // Try atom format, if nothing was found
    if (articleId === '') {
      articleId = _.get(item.getElementsByTagName('id'), [0, 'textContent'], '');
    }

    let articlePublishedDate = _.get(item.getElementsByTagName('pubDate'), [0, 'textContent'], null);
    // Try atom format, if nothing was found
    if (articlePublishedDate === null) {
      articlePublishedDate = _.get(item.getElementsByTagName('published'), [0, 'textContent'], null);
    }

    let articleURL = _.get(item.getElementsByTagName('link'), [0, 'textContent'], '');
    // Try blogger format, if nothing was found
    if (articleURL === '') {
      articleURL = _.get(item.getElementsByTagName('link'), [4], {getAttribute:() => null}).getAttribute('href') || '';
    }
    // Try atom format, if nothing was found
    if (articleURL === '') {
      articleURL = _.get(item.getElementsByTagName('link'), [0], {getAttribute:() => null}).getAttribute('href') || '';
    }

    const article = {
      id: articleId,
      feedURL,
      title: _.get(item.getElementsByTagName('title'), [0, 'textContent'], ''),
      url: articleURL,
      body: cleanedHTMLContent,
      date: new Date(articlePublishedDate).getTime(),
    };

    const finishAddingArticle = (finalArticle) => {
      unreadArticles.push(finalArticle);
      articleCallback();
    };

    // Try to get an image
    article.image = getImageFromContent(article.body);

    if (!article.image) {
      articles.getURLAsArticle(article.url, (error, articleFromURL) => {
        if (!error) {
          article.image = articleFromURL.image;

          if (article.body === 'No content.') {
            article.body = articleFromURL.body;
          }
        }

        return finishAddingArticle(article);
      });
    } else {


      finishAddingArticle(article);
    }
  }, (error) => callback(error));
};

const feeds = {

  renderFeedRow(row) {
    return (
      <TouchableHighlight
        style={styles.feed}
        onPress={this.onFeedPress.bind(this, row)}
        underlayColor='#CCC'
      >
        <View>
          <Text style={styles.feedText}>{row.title}</Text>
          <Text style={styles.feedTextURL}>{row.url}</Text>
        </View>
      </TouchableHighlight>
    );
  },

  renderFeedListModal(dataSource) {
    return (
      <Modal
        onOpened={() => {this.refs.feedListView.scrollTo({x: 0, y: 1, animated: false});}}// TODO: Hack for empty listview
        isOpen={this.state.showFeedListModal}
        onClosed={this.onClosedModal.bind(this)}
        ref="feedModal"
        swipeToClose={false} // TODO: This _could_ be true _only_ if the content in the ListView was scrolled to the top
      >
        <ListView
          ref="feedListView"
          style={{flex: 1}}
          enableEmptySections={true}
          dataSource={dataSource}
          renderRow={feeds.renderFeedRow.bind(this)}
        />
        <View
          style={styles.feedsActionButtons}
        >
          <TouchableOpacity
            onPress={this.onBackModalPress.bind(this)}
          >
            <Image
              source={assets.back.regular}
            >
            </Image>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={this.onAddModalPress.bind(this)}
          >
            <Image
              source={assets.add.regular}
            >
            </Image>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  },

  // This will loop through the RSS Feeds, fetch them, check which articles are after the latestReadId, and only return those
  fetchNewUnreadArticles: (rssFeeds, callback) => {
    const unreadArticles = [];

    async.each(rssFeeds, (rssFeed, feedCallback) => {
      fetch(rssFeed.url)
        .then((response) => response.text())
        .then(_.partialRight(parseArticleFromXML, unreadArticles, rssFeed.latestReadId, rssFeed.url, feedCallback))
        .catch((error) => feedCallback(error));
    },
    (error) => {
      if (error) {
        throw new Error(`Error fetching the feeds: ${error}`);
      }

      // Sort unreadArticles by date
      const sortedUnreadArticles = _.orderBy(unreadArticles, ['date'], ['desc']);

      callback(sortedUnreadArticles);
    });
  },

  getURLAsFeed: (url, callback) => {
    fetch(url)
      .then((response) => response.text())
      .then(_.partialRight(parseFeedFromHTML, url, callback))
      .catch(callback);
  },
};

const styles = StyleSheet.create({
  feed: {
    flex: 1,
    alignSelf: 'stretch',
    backgroundColor: '#FFFFFF',
    paddingTop: 10,
    paddingBottom: 10,
    paddingLeft: 20,
    paddingRight: 20,
    borderBottomColor: '#CCC',
    borderBottomWidth: 1,
  },
  feedText: {
    fontSize: 16,
    color: '#333',
  },
  feedTextURL: {
    fontSize: 12,
    color: '#999',
  },
  feedsActionButtons: {
    flex: 0.15,
    marginTop: 10,
    marginLeft: 10,
    marginRight: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});

export default feeds;

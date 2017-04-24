/* globals fetch */

import _ from 'lodash';
import { DOMParser, XMLSerializer } from 'xmldom';
import React from 'react';
import {
  Dimensions,
  StyleSheet,
  TouchableHighlight,
  Image,
  Text,
  ActionSheetIOS,
  Linking,
  Clipboard,
  Share,
  TouchableOpacity,
  WebView,
  View,
} from 'react-native';
import Modal from 'react-native-modalbox';

import assets from './assets';
import { domParserOptions } from './data';

const ALLOWED_HTML_TAGS = [
  '<a>',
  '<b>',
  '<p>',
  '<br>',
  '<strong>',
  '<img>',
  '<em>',
  '<hr>',
  '<div>',
  '<span>',
  '<blockquote>',
  '<section>',
  '<header>',
  '<footer>',
  '<aside>',
].join('');

// Removes html tags from input, except allowed
export const stripTags = (input, allowed) => {
  allowed = (((allowed || '') + '').toLowerCase().match(/<[a-z][a-z0-9]*>/g) || []).join('');
  const tags = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi;
  const commentsJSAndPhpTags = /<!--[\s\S]*?-->|<\?(?:php)?[\s\S]*?\?>|<(?:script)[\s\S]*?<\/script>|<(?:style)[\s\S]*?<\/style>/gi;
  return input.replace(commentsJSAndPhpTags, '').replace(tags, ($0, $1) => {
    return allowed.indexOf('<' + $1.toLowerCase() + '>') > -1 ? $0 : '';
  });
};

export const isBadImage = (imageHTMLTag) => {
  // "Small" images are usually for stats/tracking (width)
  if (imageHTMLTag.indexOf('width="1"') !== -1 || imageHTMLTag.indexOf('width=\'1\'') !== -1) {
    return true;
  }

  // "Small" images are usually for stats/tracking (height)
  if (imageHTMLTag.indexOf('height="1"') !== -1 || imageHTMLTag.indexOf('height=\'1\'') !== -1) {
    return true;
  }

  // Medium stats/tracking image
  if (imageHTMLTag.indexOf('medium.com/_/stat') !== -1) {
    return true;
  }

  // Project Wonderful ads image
  if (imageHTMLTag.indexOf('projectwonderful.com') !== -1) {
    return true;
  }

  // TODO: Improve this logic to include and bypass more ad/analytics-related stuff

  return false;
};

// Get an image from a body string
export const getImageFromContent = (body) => {
  // TODO: Ideally loop to get the first non-bad image (if there's 1 bad initially, followed by a good one, for example)
  const imageMatch = body.match(/<img[^>]+src="?([^"\s]+)"?[^>]*\/?>/i);

  if (imageMatch && !isBadImage(imageMatch[0])) {
    let imageURL = imageMatch[1];

    // If the path is relative, return nothing (too many requests figuring it out)
    if (imageURL.indexOf('http') === -1) {
      return undefined;
    }

    return imageURL;
  }

  return undefined;
};

// Parse an article from HTML
const parseArticleFromHTML = (responseText, url, callback) => {
  const doc = new DOMParser(domParserOptions).parseFromString(responseText, 'text/html');

  let image = '';
  let title = _.get(doc.getElementsByTagName('title'), [0, 'textContent'], '');

  _.each(doc.getElementsByTagName('meta'), (meta) => {
    if (!meta) {
      return;
    }
    const metaType = meta.getAttribute('property') || '';
    const metaContent = meta.getAttribute('content') || '';

    if (metaType === 'og:title') {
      title = metaContent;
    }

    if (metaType === 'og:image') {
      image = metaContent;
    }
  });

  const body = stripTags(
    new XMLSerializer(domParserOptions).serializeToString(
      (doc.getElementsByTagName('body') || [''])[0] || ''
    )
  , ALLOWED_HTML_TAGS);

  // If there's no image, get the first one from body
  if (!image) {
    image = getImageFromContent(body);
  }

  const parsedArticle = {
    id: new Date().getTime() + '',
    title,
    url,
    image,
    body,
  };

  callback(null, parsedArticle);
};

const articles = {
  buildArticleHTML: (article) => {
    const html = [];

    const maxWidth = (Dimensions.get('window').width - 20);

    html.push(`
      <style>
        body { font-family: "Helvetica Neue", Helvetica, sans-serif; }
        img { max-width: ${maxWidth}px; height: auto; }
        .pr-articleImg { margin: 10px auto !important; }
        .pr-articleBody.abertoatedemadrugada-com img { margin: 10px 0 10px -13px !important; }
      </style>
      <meta name="viewport" content="width=device-width, initial-scale=1">
    `);

    html.push(`<h1>${article.title}</h1>`);

    // If the article's image isn't in the body, add it
    if (article.body.indexOf(article.image) === -1) {
      html.push(`<div class="pr-articleImg"><img src="${article.image}" /></div>`);
    }

    // Allows for slightly custom designs
    const normalizedURL = _.get(article.url.split('/'), [2], '').replace(/\./g, '-');

    html.push(`<div class="pr-articleBody ${normalizedURL}">${article.body}</div>`);

    return html.join('');
  },

  showExportOptions(article) {
    const BUTTONS = [
      'Share',
      'View in Browser',
      'Copy URL',
      'Cancel',
    ];
    const CANCEL_INDEX = 4;

    ActionSheetIOS.showActionSheetWithOptions({
      options: BUTTONS,
      cancelButtonIndex: CANCEL_INDEX,
    },
    (buttonIndex) => {
      switch(buttonIndex) {
        case 2:
          // Copy URL to clipboard
          Clipboard.setString(article.url);
          this.refs.toast.show('URL Copied to clipboard!');

          break;

        case 1:
          // Open URL in Browser
          Linking.openURL(article.url);

          break;

        case 0:
          // Open Share pane
          Share.share({
            title: article.title,
            url: article.url,
            message: `Check out this article I liked: ${article.url}`
          });

          break;
      }
    });
  },

  renderArticleRow(row) {
    const image = row.image ? { uri: row.image } : assets.defaultImage;

    return (
      <TouchableHighlight
        style={styles.article}
        onLongPress={this.onArticleLongPress.bind(this, row)}
        onPress={this.onArticlePress.bind(this, row)}
      >
        <Image
          style={styles.articleImage}
          source={image}
        >
          <Text
            style={styles.articleText}
            numberOfLines={3}
          >
            {row.title}
          </Text>
        </Image>
      </TouchableHighlight>
    );
  },

  renderArticleModal(savedArticle, archivedArticle) {
    const deleteButton = !savedArticle ? null : (
      <TouchableOpacity
        onPress={this.onDeleteModalPress.bind(this)}
      >
        <Image
          source={assets.delete.regular}
        >
        </Image>
      </TouchableOpacity>
    );

    const saveButtonPress = !savedArticle ? this.onSaveModalPress : this.onArchiveModalPress;

    const saveButton = archivedArticle ? null : (
      <TouchableOpacity
        onPress={saveButtonPress.bind(this)}
      >
        <Image
          source={assets.save.regular}
        >
        </Image>
      </TouchableOpacity>
    );

    return (
      <Modal
        isOpen={this.state.showArticleModal}
        onClosed={this.onClosedModal.bind(this)}
        ref="articleModal"
        swipeToClose={false} // TODO: This _could_ be true _only_ if the content in the WebView was scrolled to the top
      >
          <WebView
            style={styles.articleViewContainer}
            source={{html: articles.buildArticleHTML(this.state.openArticle)}}
            automaticallyAdjustContentInsets={true}
            scalesPageToFit={true}
          />
          <View style={styles.articleActionButtons}>
            <TouchableOpacity
              onPress={this.onBackModalPress.bind(this)}
            >
              <Image
                source={assets.back.regular}
              >
              </Image>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={this.onExportModalPress.bind(this)}
            >
              <Image
                source={assets.export.regular}
              >
              </Image>
            </TouchableOpacity>
            {deleteButton}
            {saveButton}
          </View>
      </Modal>
    );
  },

  getURLAsArticle: (url, callback) => {
    fetch(url)
      .then((response) => response.text())
      .then(_.partialRight(parseArticleFromHTML, url, callback))
      .catch(callback);
  },
};

const styles = StyleSheet.create({
  article: {
    flex: 1,
    alignSelf: 'stretch',
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
    borderBottomLeftRadius: 5,
    borderBottomRightRadius: 5,
    backgroundColor: '#FFFFFF',
    marginBottom: 10,
  },
  articleImage: {
    flex: 1,
    alignItems: 'flex-end',
    flexDirection: 'row',
    width: (Dimensions.get('window').width - 20),
    height: (Dimensions.get('window').height - 20) / 3 - 40,
  },
  articleText: {
    flex: 1,
    textAlign: 'left',
    color: '#EFEFEF',
    backgroundColor: 'rgba(0, 0, 0, .5)',
    paddingTop: 3,
    paddingLeft: 5,
    paddingRight: 5,
    paddingBottom: 3,
  },
  articleViewContainer: {
    flex: 1,
  },
  articleActionButtons: {
    flex: 0.15,
    marginTop: 10,
    marginLeft: 10,
    marginRight: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});

export default articles;

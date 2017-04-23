import _ from 'lodash';
import React, { Component } from 'react';
import {
  AppRegistry,
  StyleSheet,
  View,
  ListView,
  Button,
} from 'react-native';
import Toast from 'react-native-easy-toast';
import { connect } from 'react-redux';

import actions from '../actions';
import data from '../utils/data';
import articles from '../utils/articles';

class NewTab extends Component {
  constructor(props) {
    super(props);

    this.state = {
      showArticleModal: false,
      openArticle: {
        id: 0,
        title: '',
        url: '',
        image: '',
        body: '',
      },
    };
  }

  componentDidMount() {
    this.props.onLoad();
  }

  saveArticle(article) {
    this.props.saveArticle(article);
    this.refs.toast.show('Article saved for Later!');
  }

  onArticleLongPress(row) {
    this.saveArticle(row);
  }

  onArticlePress(row) {
    this.setState({
      showArticleModal: true,
      openArticle: {
        id: row.id,
        title: row.title,
        url: row.url,
        image: row.image,
        body: row.body,
      }
    });
  }

  onClosedModal() {
    this.setState({
      showArticleModal: false,
    });
  }

  onBackModalPress() {
    this.refs.articleModal.close();
  }

  onExportModalPress() {
    const article = this.state.openArticle;

    articles.showExportOptions.call(this, article);
  }

  onSaveModalPress() {
    const article = this.state.openArticle;
    this.saveArticle(article);
    this.onBackModalPress();
  }

  render() {
    const ds = new ListView.DataSource({
      rowHasChanged: (r1, r2) => r1.id !== r2.id
    });

    const dataSource = ds.cloneWithRows(this.props.unreadArticles);

    return (
      <View style={styles.container}>
        <ListView
          style={{flex: 1}}
          enableEmptySections={true}
          dataSource={dataSource}
          renderRow={articles.renderArticleRow.bind(this)}
        />
        <View style={styles.actionButtons}>
          <View style={styles.markAsReadActionButton}>
            <Button
              onPress={this.props.onMarkAllReadPress}
              title="Mark all above as Read"
              color="#FFFFFF"
              accessibilityLabel="Mark all articles above as Read"
            />
          </View>
          <View style={styles.loadMoreActionButton}>
            <Button
              onPress={this.props.onLoad}
              title="Load more"
              color="#FFFFFF"
              accessibilityLabel="Load more articles"
            />
          </View>
        </View>

        {articles.renderArticleModal.call(this)}
        <Toast ref="toast" style={styles.toast} textStyle={styles.toastText} position="top" />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginTop: 20,
  },
  actionButtons: {
    flex: 0.18,
    marginTop: 10,
    marginLeft: 10,
    marginRight: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  markAsReadActionButton: {
    backgroundColor: '#000000',
    flex: 0.7,
    marginRight: 10,
    marginBottom: 60,
  },
  loadMoreActionButton: {
    backgroundColor: '#333333',
    flex: 0.3,
    marginBottom: 60,
  },
  toast: {
    padding: 20,
  },
  toastText: {
    fontSize: 20,
    color: '#FFFFFF',
  },
});

NewTab.propTypes = {
  onLoad: React.PropTypes.func.isRequired,
  markArticleAsLatestRead: React.PropTypes.func.isRequired,
  onMarkAllReadPress: React.PropTypes.func.isRequired,
  saveArticle: React.PropTypes.func.isRequired,
  unreadArticles: React.PropTypes.arrayOf(
    React.PropTypes.shape({
      id: React.PropTypes.string.isRequired,
      feedURL: React.PropTypes.string.isRequired,
      title: React.PropTypes.string.isRequired,
      image: React.PropTypes.string,
      url: React.PropTypes.string.isRequired,
      body: React.PropTypes.string.isRequired,
    })
  ).isRequired,
};

AppRegistry.registerComponent('NewTab', () => NewTab);

// Redux

const mapStateToProps = (state) => {
  return {
    unreadArticles: state.unreadArticles,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    onLoad: () => {
      dispatch(actions.fetchRSSFeeds(true)); // Also fetches articles
    },
    markArticleAsLatestRead: (articleId, feedURL) => {
      data.markArticleAsRead(articleId, feedURL, () => dispatch(actions.fetchArticles()));
    },
    onMarkAllReadPress: () => {
      dispatch((dispatch, getState) => {
        const { unreadArticles } = getState();

        const parsedFeeds = [];

        // Get the first of each feed, mark that as the latest read
        _.each(unreadArticles, (article) => {
          if (parsedFeeds.indexOf(article.feedURL) === -1) {
            data.markArticleAsRead(article.id, article.feedURL, () => dispatch(actions.fetchArticles()));
            parsedFeeds.push(article.feedURL);
          }
        });
      });
    },
    saveArticle: (article) => {
      data.addSavedArticle(article, () => dispatch(actions.fetchSavedArticles()));
    },
  };
};

const NewTabContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(NewTab);

export default NewTabContainer;

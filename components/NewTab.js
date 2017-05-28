import _ from 'lodash';
import React, { Component } from 'react';
import {
  AppRegistry,
  StyleSheet,
  View,
  ListView,
  Button,
  RefreshControl,
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
      refreshing: true,
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
    this.props.onLoad(() => {
      this.setState({
        refreshing: false,
      });
    });
  }

  /*componentWillReceiveProps() {
    this.onRefresh();
  }*/

  onRefresh() {
    this.setState({
      refreshing: true,
    });

    this.props.onLoad(() => {
      this.setState({
        refreshing: false,
      });
    });
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

    const dataLength = this.props.unreadArticles.length;

    const buttonAction = dataLength ? this.props.onMarkAllReadPress : this.onRefresh.bind(this);
    const buttonLabel = dataLength ? 'Mark all articles above as Read' : (this.state.refreshing ? 'Loading...' : 'Load articles');

    return (
      <View style={styles.container}>
        <ListView
          style={{flex: 1}}
          enableEmptySections={true}
          dataSource={dataSource}
          renderRow={articles.renderArticleRow.bind(this)}
          refreshControl={
            <RefreshControl
              tintColor="#222222"
              refreshing={this.state.refreshing}
              onRefresh={this.onRefresh.bind(this)}
            />
          }
        />
        <View style={styles.actionButtons}>
          <View style={styles.markAsReadActionButton}>
            <Button
              onPress={buttonAction}
              title={buttonLabel}
              color="#FFFFFF"
              accessibilityLabel={buttonLabel}
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
    flex: 1,
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
    onLoad: (callback) => {
      dispatch(actions.fetchRSSFeeds(true, callback)); // Also fetches articles
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

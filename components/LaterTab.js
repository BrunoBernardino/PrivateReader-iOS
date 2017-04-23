import async from 'async';
import React, { Component } from 'react';
import {
  AppRegistry,
  StyleSheet,
  View,
  ListView,
  Button,
  Alert,
  AlertIOS,
} from 'react-native';
import Toast from 'react-native-easy-toast';
import { connect } from 'react-redux';

import actions from '../actions';
import data from '../utils/data';
import articles from '../utils/articles';

class LaterTab extends Component {
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

  archiveArticle(article) {
    this.props.archiveArticle(article);
    setTimeout(() => this.props.removeSavedArticle(article), 100); // Lovely
    this.refs.toast.show('Article moved to archive!');
  }

  deleteArticle(article) {
    this.props.removeSavedArticle(article);
    this.refs.toast.show('Article removed!');
  }

  onAddPress() {
    AlertIOS.prompt(
      'What\'s the URL?',
      '"https://" will be prefixed automatically if no protocol is specified.',
      (url) => {
        if (url) {
          // Automatically prefix https://
          if (url.indexOf('http') !== 0) {
            url = `https://${url}`;
          }

          articles.getURLAsArticle(url, (error, article) => {
            if (!error) {
              this.props.saveArticle(article);
              this.refs.toast.show('URL Added!');
            } else {
              Alert.alert('Error', `Error Parsing URL: "${url}", with error "${error}".\n\nIt should start with "http://" or "https://".`);
            }
          });
        }
      }
    );
  }

  onRemoveAllPress() {
    const title = 'Are you sure?';
    const message = 'This will delete all the saved URLs for all devices using PrivateReader with this iCloud account.';

    const buttons = [
      {text: 'Cancel', onPress: () => {}, style: 'cancel'},
      {text: 'Delete', onPress: () => this.props.removeAllArticles(this.props.savedArticles), style: 'destructive'},
    ];

    Alert.alert(title, message, buttons);
  }

  onArticleLongPress(row) {
    this.archiveArticle(row);
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

  onArchiveModalPress() {
    const article = this.state.openArticle;
    this.archiveArticle(article);
    this.onBackModalPress();
  }

  onDeleteModalPress() {
    const article = this.state.openArticle;
    this.deleteArticle(article);
    this.onBackModalPress();
  }

  render() {
    const ds = new ListView.DataSource({
      rowHasChanged: (r1, r2) => r1.id !== r2.id
    });

    const dataSource = ds.cloneWithRows(this.props.savedArticles);

    return (
      <View style={styles.container}>
        <ListView
          style={{flex: 1}}
          enableEmptySections={true}
          dataSource={dataSource}
          renderRow={articles.renderArticleRow.bind(this)}
        />
        <View style={styles.actionButtons}>
          <View style={styles.removeAllActionButton}>
            <Button
              onPress={this.onRemoveAllPress.bind(this)}
              title="Remove all above"
              color="#FFFFFF"
              accessibilityLabel="Remove all articles above from Later"
            />
          </View>
          <View style={styles.addActionButton}>
            <Button
              onPress={this.onAddPress.bind(this)}
              title="Add URL"
              color="#FFFFFF"
              accessibilityLabel="Add article from URL"
            />
          </View>
        </View>

        {articles.renderArticleModal.call(this, true)}
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
  removeAllActionButton: {
    backgroundColor: '#000000',
    flex: 0.6,
    marginRight: 10,
    marginBottom: 60,
  },
  addActionButton: {
    backgroundColor: '#333333',
    flex: 0.4,
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

LaterTab.propTypes = {
  onLoad: React.PropTypes.func.isRequired,
  archiveArticle: React.PropTypes.func.isRequired,
  removeSavedArticle: React.PropTypes.func.isRequired,
  removeAllArticles: React.PropTypes.func.isRequired,
  saveArticle: React.PropTypes.func.isRequired,
  savedArticles: React.PropTypes.arrayOf(
    React.PropTypes.shape({
      id: React.PropTypes.string.isRequired,
      title: React.PropTypes.string.isRequired,
      image: React.PropTypes.string,
      url: React.PropTypes.string.isRequired,
      body: React.PropTypes.string.isRequired,
    })
  ).isRequired,
};

AppRegistry.registerComponent('LaterTab', () => LaterTab);

// Redux

const mapStateToProps = (state) => {
  return {
    savedArticles: state.savedArticles,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    onLoad: () => {
      dispatch(actions.fetchSavedArticles());
    },
    archiveArticle: (article) => {
      data.addArchivedArticle(article, () => {
        dispatch(actions.fetchSavedArticles());
        dispatch(actions.fetchArchivedArticles());
      });
    },
    removeSavedArticle: (article) => {
      data.removeSavedArticle(article.url, () => dispatch(actions.fetchSavedArticles()));
    },
    removeAllArticles: (articles) => {
      async.eachSeries(articles, (article, callback) => {
        data.removeSavedArticle(article.url, () => callback());
      }, () => {
        dispatch(actions.fetchSavedArticles());
      });
    },
    saveArticle: (article) => {
      data.addSavedArticle(article, () => dispatch(actions.fetchSavedArticles()));
    },
  };
};

const LaterTabContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(LaterTab);

export default LaterTabContainer;

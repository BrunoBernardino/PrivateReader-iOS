import React, { Component } from 'react';
import {
  AppRegistry,
  StyleSheet,
  View,
  ScrollView,
  Alert,
  ListView,
  AlertIOS,
  NativeModules,
} from 'react-native';
import Toast from 'react-native-easy-toast';
import { connect } from 'react-redux';

import actions from '../actions';
import data from '../utils/data';
import feeds from '../utils/feeds';

import SettingsButton from './SettingsButton';

const DocumentPicker = NativeModules.RNDocumentPicker;

class SettingsTab extends Component {

  constructor(props) {
    super(props);

    this.state = {
      showFeedListModal: false,
      openFeed: {
        id: 0,
      },
    };
  }

  componentDidMount() {
    this.props.onLoad();
  }

  onPressManageRSS() {
    this.setState({
      showFeedListModal: true,
    });
  }

  onPressImportData() {
    const title = 'Which data?';
    const message = 'Do you want to import Feeds or Articles?';

    const buttons = [
      {text: 'Cancel', onPress: () => {}, style: 'cancel'},
      {text: 'Feeds', onPress: () => this.importFeeds.call(this)},
      {text: 'Saved/Archived Articles', onPress: () => this.importArticles.call(this)},
    ];

    Alert.alert(title, message, buttons);
  }

  importFeeds() {
    DocumentPicker.show({
      filetype: ['public.content'],
    }, (error, url) => {
      if (!error) {
        this.props.importData('feeds', url, () => {
          this.refs.toast.show('Feeds imported successfully!');
        });
        this.refs.toast.show('Importing feeds...');
      } else {
        Alert.alert('Error', `Error Finding File: "${url}".\n\nPlease make sure you have choosen a correct OPML file.`);
      }
    });
  }

  importArticles() {
    DocumentPicker.show({
      filetype: ['public.html'],
    }, (error, url) => {
      if (!error) {
        this.props.importData('articles', url, () => {
          this.refs.toast.show('Articles imported successfully!');
        });
        this.refs.toast.show('Importing articles...');
      } else {
        Alert.alert('Error', `Error Finding File: "${url}".\n\nPlease make sure you have choosen a correct HTML file.`);
      }
    });
  }

  onPressExportData() {
    this.props.exportData(() => {
      this.refs.toast.show('OPML and HTML Files created in your iCloud Drive!');
    });
    this.refs.toast.show('Exporting...');
  }

  onRemoveAllData() {
    this.props.removeAllData(() => {
      this.refs.toast.show('All Data Deleted!');
    });
  }

  onPressDeleteData() {
    const title = 'Are you sure?';
    const message = 'This will delete all RSS feeds, saved, and archived articles for all devices using PrivateReader with this iCloud account.';

    const buttons = [
      {text: 'Cancel', onPress: () => {}, style: 'cancel'},
      {text: 'Delete', onPress: () => this.onRemoveAllData.call(this), style: 'destructive'},
    ];

    Alert.alert(title, message, buttons);
  }

  onClosedModal() {
    this.setState({
      showFeedListModal: false,
    });
  }

  onBackModalPress() {
    this.refs.feedModal.close();
  }

  onAddModalPress() {
    AlertIOS.prompt(
      'What\'s the URL?',
      '"https://" will be prefixed automatically if no protocol is specified.',
      (url) => {
        if (url) {
          // Automatically prefix https://
          if (url.indexOf('http') !== 0) {
            url = `https://${url}`;
          }

          feeds.getURLAsFeed(url, (error, feed) => {
            if (!error && feed && feed.title && feed.url) {
              this.props.addRSSFeed(feed);
              this.refs.toast.show('RSS Feed Added!');
            } else {
              Alert.alert('Error', `Error Parsing URL: "${url}", with error "${error}".\n\nIt should start with "http://" or "https://" and be a valid RSS feed.`);
            }
          });
        }
      }
    );
  }

  onFeedPress(feed) {
    const title = 'Are you sure?';
    const message = `This will delete the "${feed.title}" RSS feed permanently from this device and all other devices using PrivateReader with this iCloud account.`;

    const buttons = [
      {text: 'Cancel', onPress: () => {}, style: 'cancel'},
      {text: 'Delete', onPress: () => this.props.removeRSSFeed(feed.url), style: 'destructive'},
    ];

    Alert.alert(title, message, buttons);
  }

  render() {
    const ds = new ListView.DataSource({
      rowHasChanged: (r1, r2) => r1.id !== r2.id
    });

    const dataSource = ds.cloneWithRows(this.props.rssFeeds);

    return (
      <View style={styles.container}>
        <ScrollView style={{flex: 1}}>
          <SettingsButton
            onPress={this.onPressManageRSS.bind(this)}
            text='Manage RSS'
          />

          <SettingsButton
            onPress={this.onPressImportData.bind(this)}
            text='Import Data'
          />

          <SettingsButton
            onPress={this.onPressExportData.bind(this)}
            text='Export Data'
          />

          <SettingsButton
            onPress={this.onPressDeleteData.bind(this)}
            text='Delete Data'
          />
        </ScrollView>

        {feeds.renderFeedListModal.call(this, dataSource)}
        <Toast ref="toast" style={styles.toast} textStyle={styles.toastText} position="top" />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    marginTop: 20,
  },
  toast: {
    padding: 20,
  },
  toastText: {
    fontSize: 20,
    color: '#FFFFFF',
  },
});

SettingsTab.propTypes = {
  onLoad: React.PropTypes.func.isRequired,
  removeAllData: React.PropTypes.func.isRequired,
  addRSSFeed: React.PropTypes.func.isRequired,
  removeRSSFeed: React.PropTypes.func.isRequired,
  importData: React.PropTypes.func.isRequired,
  exportData: React.PropTypes.func.isRequired,
  rssFeeds: React.PropTypes.arrayOf(
    React.PropTypes.shape({
      id: React.PropTypes.string.isRequired,
      title: React.PropTypes.string.isRequired,
      url: React.PropTypes.string.isRequired,
      latestReadId: React.PropTypes.string.isRequired,
    })
  ).isRequired,
};

AppRegistry.registerComponent('SettingsTab', () => SettingsTab);

// Redux

const mapStateToProps = (state) => {
  return {
    rssFeeds: state.rssFeeds,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    onLoad: () => {
      dispatch(actions.fetchRSSFeeds(true)); // Also fetches articles
      dispatch(actions.fetchSavedArticles());
      dispatch(actions.fetchArchivedArticles());
    },
    removeAllData: (callback) => {
      data.removeAllData(() => {
        dispatch(actions.fetchRSSFeeds(true)); // Also fetches articles
        dispatch(actions.fetchSavedArticles());
        dispatch(actions.fetchArchivedArticles());
        callback();
      });
    },
    addRSSFeed: (rssFeed) => {
      data.addRSSFeed(rssFeed, () => dispatch(actions.fetchRSSFeeds()));
    },
    removeRSSFeed: (rssFeedURL) => {
      data.removeRSSFeed(rssFeedURL, () => dispatch(actions.fetchRSSFeeds()));
    },
    importData: (type, fileURL, callback) => {
      data.importData(type, fileURL, () => {
        dispatch(actions.fetchRSSFeeds(true)); // Also fetches articles
        dispatch(actions.fetchSavedArticles());
        dispatch(actions.fetchArchivedArticles());
        callback();
      });
    },
    exportData: (callback) => {
      dispatch((dispatch, getState) => {
        const { rssFeeds, savedArticles, archivedArticles } = getState();

        data.exportData(rssFeeds, savedArticles, archivedArticles, callback);
      });
    },
  };
};

const SettingsTabContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(SettingsTab);

export default SettingsTabContainer;

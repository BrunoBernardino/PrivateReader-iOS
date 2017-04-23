import React, { Component } from 'react';
import {
  AppRegistry,
  StyleSheet,
  View,
  ListView,
} from 'react-native';
import Toast from 'react-native-easy-toast';
import { connect } from 'react-redux';

import actions from '../actions';
import data from '../utils/data';
import articles from '../utils/articles';

class ArchiveTab extends Component {
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

  deleteArticle(article) {
    this.props.removeArchivedArticle(article);
    this.refs.toast.show('Article removed from archive!');
  }

  onArticleLongPress(row) {
    this.onArticlePress(row);
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

  onDeleteModalPress() {
    const article = this.state.openArticle;
    this.deleteArticle(article);
    this.onBackModalPress();
  }

  render() {
    const ds = new ListView.DataSource({
      rowHasChanged: (r1, r2) => r1.id !== r2.id
    });

    const dataSource = ds.cloneWithRows(this.props.archivedArticles);

    return (
      <View style={styles.container}>
        <ListView
          style={{flex: 1}}
          enableEmptySections={true}
          dataSource={dataSource}
          renderRow={articles.renderArticleRow.bind(this)}
        />

        {articles.renderArticleModal.call(this, true, true)}
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
  toast: {
    padding: 20,
  },
  toastText: {
    fontSize: 20,
    color: '#FFFFFF',
  },
});

ArchiveTab.propTypes = {
  onLoad: React.PropTypes.func.isRequired,
  removeArchivedArticle: React.PropTypes.func.isRequired,
  archivedArticles: React.PropTypes.arrayOf(
    React.PropTypes.shape({
      id: React.PropTypes.string.isRequired,
      title: React.PropTypes.string.isRequired,
      image: React.PropTypes.string,
      url: React.PropTypes.string.isRequired,
      body: React.PropTypes.string.isRequired,
    })
  ).isRequired,
};

AppRegistry.registerComponent('ArchiveTab', () => ArchiveTab);

// Redux

const mapStateToProps = (state) => {
  return {
    archivedArticles: state.archivedArticles,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    onLoad: () => {
      dispatch(actions.fetchArchivedArticles());
    },
    removeArchivedArticle: (article) => {
      data.removeArchivedArticle(article.url, () => dispatch(actions.fetchArchivedArticles()));
    },
  };
};

const ArchiveTabContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(ArchiveTab);

export default ArchiveTabContainer;

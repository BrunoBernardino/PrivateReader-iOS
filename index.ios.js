import React, { Component } from 'react';
import {
  AppRegistry,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Provider } from 'react-redux';
import { createStore, applyMiddleware } from 'redux';
import thunkMiddleware from 'redux-thunk';

import reducer from './reducer';
import data from './utils/data';
import TabView from './components/TabView';

const store = createStore(
  reducer,
  applyMiddleware(
    thunkMiddleware
  )
);

data.init();

export default class PrivateReader extends Component {
  constructor(props) {
    super(props);

    this.state = {
      hasSetup: data.hasSetup(),
    };
  }

  onSetup() {
    data.setSetup(true);

    this.setState({
      hasSetup: true,
    });
  }

  render() {
    const { state } = this;

    if (!state.hasSetup) {
      return (
        <View style={styles.container}>
          <Text style={styles.welcome}>
            Welcome to PrivateReader!
          </Text>
          <Text style={styles.instructions} onPress={this.onSetup.bind(this)}>
            Tap this to get started
          </Text>
        </View>
      );
    }

    return (
      <Provider store={store}>
        <TabView />
      </Provider>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
});

AppRegistry.registerComponent('PrivateReader', () => PrivateReader);

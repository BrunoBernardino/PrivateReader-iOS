import React, { Component } from 'react';
import {
  AppRegistry,
  StyleSheet,
  TouchableHighlight,
  Text,
  View,
} from 'react-native';

export default class SettingsButton extends Component {

  render() {
    return (
      <TouchableHighlight
        style={styles.button}
        underlayColor='#CCC'
        onPress={this.props.onPress}
      >
        <View style={styles.buttonWrapper}>
          <Text style={styles.buttonText}>{this.props.text}</Text>
          <Text style={styles.buttonArrow}>»</Text>
        </View>
      </TouchableHighlight>
    );
  }
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#FFF',
    flex: 1,
    alignSelf: 'stretch',
    borderBottomColor: '#CCC',
    borderBottomWidth: 1,
  },
  buttonWrapper: {
    paddingTop: 10,
    paddingBottom: 10,
    paddingLeft: 20,
    paddingRight: 20,
    flexDirection: 'row',
    flex: 1,
  },
  buttonText: {
    fontSize: 20,
    color: '#333',
    flex: 0.8,
    textAlign: 'left',
    paddingTop: 5,
  },
  buttonArrow: {
    fontSize: 30,
    color: '#333',
    flex: 0.2,
    textAlign: 'right',
  }
});

SettingsButton.propTypes = {
  text: React.PropTypes.string.isRequired,
  onPress: React.PropTypes.func.isRequired,
};

AppRegistry.registerComponent('SettingsButton', () => SettingsButton);

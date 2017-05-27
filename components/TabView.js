import React, { Component } from 'react';
import {
  AppRegistry,
  TabBarIOS,
} from 'react-native';

import assets from '../utils/assets';
import NewTab from './NewTab';
import LaterTab from './LaterTab';
import ArchiveTab from './ArchiveTab';
import SettingsTab from './SettingsTab';

export default class TabView extends Component {
  constructor(props) {
    super(props);

    this.state = {
      tabShowing: 'new',
    };
  }

  onTabChange(newTab) {
    this.setState({
      tabShowing: newTab,
    });
  }

  render() {
    return (
      <TabBarIOS
        barTintColor="black"
        tintColor="white"
        translucent={true}
        unselectedItemTintColor="gray"
        unselectedTintColor="gray"
      >
        <TabBarIOS.Item
          title="Settings"
          icon={assets.settings.regular}
          selectedIcon={assets.settings.selected}
          selected={this.state.tabShowing === 'settings'}
          onPress={this.onTabChange.bind(this, 'settings')}
        >
          <SettingsTab />
        </TabBarIOS.Item>

        <TabBarIOS.Item
          title="Archive"
          icon={assets.archive.regular}
          selectedIcon={assets.archive.selected}
          selected={this.state.tabShowing === 'archive'}
          onPress={this.onTabChange.bind(this, 'archive')}
        >
          <ArchiveTab />
        </TabBarIOS.Item>

        <TabBarIOS.Item
          title="Later"
          icon={assets.later.regular}
          selectedIcon={assets.later.selected}
          selected={this.state.tabShowing === 'later'}
          onPress={this.onTabChange.bind(this, 'later')}
        >
          <LaterTab />
        </TabBarIOS.Item>

        <TabBarIOS.Item
          title="New"
          icon={assets.new.regular}
          selectedIcon={assets.new.selected}
          selected={this.state.tabShowing === 'new'}
          onPress={this.onTabChange.bind(this, 'new')}
        >
          <NewTab />
        </TabBarIOS.Item>
      </TabBarIOS>
    );
  }
}

AppRegistry.registerComponent('TabView', () => TabView);

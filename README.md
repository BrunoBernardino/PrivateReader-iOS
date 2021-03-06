# PrivateReader - A Privacy-focused reader

It's an RSS Feed + Read Later service integrated into a single app, focused on privacy.

It's end-to-end encrypted, using iCloud Keychain and PouchDB for sync (of the encrypted data).

Minimal, nothing to get in the way of just reading.

**NOTE:** Right now, there are no plans to launch this in the App Store, as it's an app very tailored to my own needs. Anyone can grab it and do whatever they want, though.

## Thanks

- [Thanks to David Benko for the core data encryption code](https://github.com/DavidBenko/Encrypted-Core-Data)
- [Thanks to Icons8 for all the icons](https://icons8.com/web-app/category/ios7/Very-Basic)

# Useful info about security

- iCloud Keychain is encrypted on the device: https://support.apple.com/en-us/HT202303

# How it looks

![showcase](https://cloud.githubusercontent.com/assets/1239616/25312507/0307daf6-2813-11e7-9f19-b11f2999244c.png)

[You can see here in more detail](https://github.com/BrunoBernardino/PrivateReader-iOS/issues/1).

# Development-related

### Setup:

```bash
$ npm install -g react-native-cli
$ npm install
$ react-native run-ios --simulator "iPhone 6s"
```

### Important TODOs:

- Change DB from Core Data & Native Components to PouchDB and use https://github.com/calvinmetcalf/crypto-pouch. For Keychain saving use https://github.com/oblador/react-native-keychain
- Allow setting PouchDB Server URL in Settings
- Allow synchronizing with remote PouchDB

### TODOs for a potential Launch:

- Make sure duplicate URLs are impossible to add to saved and archive (with code to check on JS, if necessary)
- Work on something for loadings
- Make importing/exporting feeds/articles really work (`utils/data.js`)
- Improve setup screen on `index.ios.js` (explain/show button for importing feeds - also explain long press to add to save for later)
- Add instructions to click Settings and Manage RSS to add content in empty feed, and also load all (old/read) articles if there are feeds

### Later TODOs:

- Add basic tests - certain rss/feeds should load from direct and parent urls, all components load without errors
- Add swipe left to delete feed (on list) - potentially use https://js.coach/react-native/react-native-swipe-list-view
- Add swipe left to delete article (on list)
- Add swipe right to save/archive article (on list)
- When pulling up (scrolling for articles), at the bottom, show option to mark all as read by dragging a little bit more

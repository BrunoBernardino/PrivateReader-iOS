//
//  RCTDataManager.m
//
//  Created by BrunoBernardino on 28/02/2017.
//  Uncopyright
//

#import "RCTDataManager.h"

@implementation RCTDataManager

RCT_EXPORT_MODULE();

/*
 import { NativeModules } from 'react-native';
 const DataManager = NativeModules.DataManager;

 DataManager.hasSetup((result) => {});
 DataManager.setSetup();
 DataManager.get(key, (result) => {});
 DataManager.addFeed(url, title, (result) => {});
 DataManager.removeFeed(url, (result) => {});
 DataManager.addURL(type, url, title, image, body, (result) => {});
 DataManager.removeURL(type, url, (result) => {});
 DataManager.markArticleAsRead(articleId, feedURL, (result) => {});
 DataManager.removeAllData((result) => {});
 DataManager.exportData((result) => {});

 TODO: maybe build and expose a sync method? Or just add it in AppDelegate for when the application is closing?
*/

#pragma mark - get stuff from Core Data, unencrypted

RCT_EXPORT_METHOD(hasSetup :(RCTResponseSenderBlock)callback)
{
  NSDictionary *resultsDict = @{
                                @"success": @YES,
                                @"hasSetup": [NSNumber numberWithBool:[self internalHasSetup]]
                              };

  callback(@[resultsDict]);
}

RCT_EXPORT_METHOD(setSetup :(BOOL *)newValue)
{
  [self internalSetSetup:newValue];
}

RCT_EXPORT_METHOD(get :(NSString *)key :(RCTResponseSenderBlock)callback)
{
  dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{

    if ([key isEqualToString:@"RSSFeeds"]) {

      NSArray *encryptedFeeds = [self getAllRSSFeeds];

      NSMutableArray *feeds = [NSMutableArray arrayWithArray:@[]];

      for (NSManagedObject *encryptedFeed in encryptedFeeds) {
        NSDictionary *feed = @{
                               @"id": [NSString stringWithFormat:@"%@", [encryptedFeed objectID]],
                               @"title": [encryptedFeed valueForKey:@"title"],
                               @"url": [encryptedFeed valueForKey:@"url"],
                               @"latestReadId": [encryptedFeed valueForKey:@"latestReadId"],
                             };

        [feeds addObject:feed];
      }

      NSDictionary *resultsDict = @{
                                    @"success": @YES,
                                    @"feeds": feeds,
                                  };

      return callback(@[resultsDict]);
    }

    if ([key isEqualToString:@"ArchivedURLs"] || [key isEqualToString:@"SavedURLs"]) {

      NSArray *encryptedURLs = [key isEqualToString:@"ArchivedURLs"] ? [self getAllArchivedURLs] : [self getAllSavedURLs];

      NSMutableArray *urls = [NSMutableArray arrayWithArray:@[]];

      for (NSManagedObject *encryptedURL in encryptedURLs) {
        NSDictionary *url = @{
                               @"id": [NSString stringWithFormat:@"%@", [encryptedURL objectID]],
                               @"title": [encryptedURL valueForKey:@"title"],
                               @"url": [encryptedURL valueForKey:@"url"],
                               @"image": [encryptedURL valueForKey:@"image"],
                               @"date": [encryptedURL valueForKey:@"date"],
                               @"body": [encryptedURL valueForKey:@"body"],
                            };

        [urls addObject:url];
      }

      NSDictionary *resultsDict = @{
                                    @"success": @YES,
                                    @"urls": urls,
                                  };

      return callback(@[resultsDict]);
    }

    NSDictionary *defaultResultsDict = @{
                                        @"success": @NO,
                                       };

    callback(@[defaultResultsDict]);
  });
}

RCT_EXPORT_METHOD(addFeed :(NSString *)url :(NSString *)title :(RCTResponseSenderBlock)callback)
{
  dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{

    NSDictionary *resultsDict = @{
                                  @"success": [NSNumber numberWithBool:[self addRSSFeed:url :title]],
                                };

    callback(@[resultsDict]);
  });
}

RCT_EXPORT_METHOD(removeFeed :(NSString *)url :(RCTResponseSenderBlock)callback)
{
  dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{

    NSDictionary *resultsDict = @{
                                  @"success": [NSNumber numberWithBool:[self internalRemoveFeed:url]],
                                };

    callback(@[resultsDict]);
  });
}

RCT_EXPORT_METHOD(addURL :(NSString *)type :(NSString *)url :(NSString *)title :(NSString *)image :(NSString *)body :(RCTResponseSenderBlock)callback)
{
  dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{

    NSDictionary *resultsDict = @{
                                  @"success": [NSNumber numberWithBool:[self internalAddURL:type :url :title :image :body]],
                                };

    callback(@[resultsDict]);
  });
}

RCT_EXPORT_METHOD(removeURL :(NSString *)type :(NSString *)url :(RCTResponseSenderBlock)callback)
{
  dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{

    NSDictionary *resultsDict = @{
                                  @"success": [NSNumber numberWithBool:[self internalRemoveURL:type :url]],
                                };

    callback(@[resultsDict]);
  });
}

RCT_EXPORT_METHOD(markArticleAsRead :(NSString *)articleId :(NSString *)feedURL :(RCTResponseSenderBlock)callback)
{
  NSDictionary *resultsDict = @{
                                @"success": [NSNumber numberWithBool:[self internalMarkArticleAsRead:articleId :feedURL]],
                              };

  callback(@[resultsDict]);

}

RCT_EXPORT_METHOD(removeAllData :(RCTResponseSenderBlock)callback)
{
  NSDictionary *resultsDict = @{
                                @"success": [NSNumber numberWithBool:[self internalRemoveAllData]]
                              };

  callback(@[resultsDict]);
}

RCT_EXPORT_METHOD(exportData :(NSString *)opmlFileContents :(NSString *)htmlFileContents :(RCTResponseSenderBlock)callback)
{
  NSDictionary *resultsDict = @{
                                @"success": @YES,
                                @"filePaths": [self internalExportData :opmlFileContents :htmlFileContents]
                              };

  callback(@[resultsDict]);
}


#pragma mark - private methods

// Add RSS Feed
- (BOOL)addRSSFeed :(NSString *)feedURL :(NSString *)feedTitle
{
  NSManagedObjectContext *context = [self managedObjectContext];
  NSManagedObject *newFeed = [NSEntityDescription
                  insertNewObjectForEntityForName:@"RSSFeed"
                  inManagedObjectContext:context];

  [newFeed setValue:feedTitle forKey:@"title"];
  [newFeed setValue:feedURL forKey:@"url"];
  [newFeed setValue:@"" forKey:@"latestReadId"];

  @try {
    NSError *error;
    [context save:&error];

    return @YES;
  }
  @catch (NSException *exception) {
    NSLog( @"Exception: %@", exception );

    return @NO;
  }
}

// Remove Feed
- (BOOL)internalRemoveFeed :(NSString *)url
{
  NSManagedObjectContext *context = [self managedObjectContext];
  NSManagedObject *existingURL = [self getItemByURL:@"RSSFeed" :url];

  @try {
    NSError *error;
    [context deleteObject:existingURL];
    [context save:&error];

    return @YES;
  }
  @catch (NSException *exception) {
    NSLog( @"Exception: %@", exception );

    return @NO;
  }
}

// Add Archived or Saved URL
- (BOOL)internalAddURL :(NSString *)type :(NSString *)url :(NSString *)title :(NSString *)image :(NSString *)body
{
  NSManagedObjectContext *context = [self managedObjectContext];
  NSManagedObject *newURL = [NSEntityDescription
                              insertNewObjectForEntityForName:type
                              inManagedObjectContext:context];

  [newURL setValue:url forKey:@"url"];
  [newURL setValue:title forKey:@"title"];
  [newURL setValue:image forKey:@"image"];
  [newURL setValue:body forKey:@"body"];
  [newURL setValue:[NSDate date] forKey:@"date"];

  @try {
    NSError *error;
    [context save:&error];

    return @YES;
  }
  @catch (NSException *exception) {
    NSLog( @"Exception: %@", exception );

    return @NO;
  }
}

// Remove Archived or Saved URL
- (BOOL)internalRemoveURL :(NSString *)type :(NSString *)url
{
  NSManagedObjectContext *context = [self managedObjectContext];
  NSManagedObject *existingURL = [self getItemByURL:type :url];

  @try {
    NSError *error;
    [context deleteObject:existingURL];
    [context save:&error];

    return @YES;
  }
  @catch (NSException *exception) {
    NSLog( @"Exception: %@", exception );

    return @NO;
  }
}

// Get all RSS Feeds
- (NSMutableArray *)getAllRSSFeeds
{
  NSManagedObjectContext *context = [self managedObjectContext];

  NSEntityDescription *entityDesc = [NSEntityDescription entityForName:@"RSSFeed" inManagedObjectContext:context];

  NSFetchRequest *request = [[NSFetchRequest alloc] init];
  [request setEntity:entityDesc];

	@try {
		NSError *error;
		NSArray *objects = [context executeFetchRequest:request error:&error];

		return [NSMutableArray arrayWithArray:objects];
	}
	@catch (NSException *exception) {
		NSLog( @"Exception: %@", exception );

		return [NSMutableArray arrayWithArray:@[]];
	}
}

// Get all Saved or Archived URLs
- (NSMutableArray *)getURLs :(NSString *)URLType
{
  NSManagedObjectContext *context = [self managedObjectContext];

  NSEntityDescription *entityDesc = [NSEntityDescription entityForName:URLType inManagedObjectContext:context];

  NSFetchRequest *request = [[NSFetchRequest alloc] init];
  [request setEntity:entityDesc];

  // Sort articles by date (most recent on top/first)
  NSSortDescriptor *sortDescriptor = [[NSSortDescriptor alloc] initWithKey:@"date" ascending:NO];
  NSArray *sortDescriptors = [[NSArray alloc] initWithObjects:sortDescriptor, nil];
  [request setSortDescriptors:sortDescriptors];

  @try {
    NSError *error;
    NSArray *objects = [context executeFetchRequest:request error:&error];

    return [NSMutableArray arrayWithArray:objects];
  }
  @catch (NSException *exception) {
    NSLog( @"Exception: %@", exception );

    return [NSMutableArray arrayWithArray:@[]];
  }
}

// Get all Archived URLs
- (NSMutableArray *)getAllArchivedURLs
{
  return [self getURLs:@"ArchivedURL"];
}

// Get all Saved URLs
- (NSMutableArray *)getAllSavedURLs
{
  return [self getURLs:@"SavedURL"];
}

// Remove All Data
- (BOOL) internalRemoveAllData
{
	NSURL *storeURL = [[self applicationDocumentsDirectory] URLByAppendingPathComponent:@"DataDB.sqlite"];
	NSPersistentStore *store = [_persistentStoreCoordinator persistentStoreForURL:storeURL];

	[self.persistentStoreCoordinator removePersistentStore:store error:nil];
	[[NSFileManager defaultManager] removeItemAtURL:[store URL] error:nil];

	_managedObjectContext = nil;
	_persistentStoreCoordinator = nil;

	// Reload data
	[self managedObjectContext];
	[self persistentStoreCoordinator];

  return @YES;
}

// Get an object by URL
- (NSManagedObject *) getItemByURL :(NSString *)type :(NSString *)url
{
  NSManagedObjectContext *context = [self managedObjectContext];

  NSEntityDescription *entityDesc = [NSEntityDescription entityForName:type inManagedObjectContext:context];

  NSFetchRequest *request = [[NSFetchRequest alloc] init];
  [request setEntity:entityDesc];
  [request setPredicate:[NSPredicate predicateWithFormat:@"(url == %@)", url]];
  [request setFetchLimit:1];

  @try {
    NSError *error;
    NSArray *objects = [context executeFetchRequest:request error:&error];

    return [objects objectAtIndex:0];
  }
  @catch (NSException *exception) {
    NSLog( @"Exception: %@", exception );

    NSManagedObject *fakeURL = [NSEntityDescription
                                insertNewObjectForEntityForName:type
                                inManagedObjectContext:context];

    return fakeURL;
  }
}

// Mark article as read
- (BOOL) internalMarkArticleAsRead :(NSString *)articleId :(NSString *)feedURL
{
  NSManagedObjectContext *context = [self managedObjectContext];

  NSEntityDescription *entityDesc = [NSEntityDescription entityForName:@"RSSFeed" inManagedObjectContext:context];

  NSFetchRequest *request = [[NSFetchRequest alloc] init];
  [request setEntity:entityDesc];
  [request setPredicate:[NSPredicate predicateWithFormat:@"(url == %@)", feedURL]];
  [request setFetchLimit:1];

  @try {
    NSError *error;
    NSArray *objects = [context executeFetchRequest:request error:&error];

    NSManagedObject *rssFeed = [objects objectAtIndex:0];

    // Update it now
    [rssFeed setValue:articleId forKey:@"latestReadId"];
    [context save:&error];
  }
  @catch (NSException *exception) {
    NSLog( @"Exception: %@", exception );

    return NO;
  }

  return YES;
}

// Create OPML file with RSS Feeds, and HTML file with Saved and Archived URLs
- (NSArray *) internalExportData :(NSString *)opmlFileContentsString :(NSString *)htmlFileContentsString {
  NSDateFormatter *dateFormatter = [[NSDateFormatter alloc] init];
  [dateFormatter setDateFormat:@"YYYYMMddHHmmss"];
  NSString *uniqueTime = [dateFormatter stringFromDate:[NSDate date]];

  // OPML
  NSString *feedsFileName = [NSString stringWithFormat:@"PrivateReader-export-%@.opml", uniqueTime];
  NSString *feedsFilePath = [NSString stringWithFormat:@"Documents/%@", feedsFileName];

  NSString *opmlFilePath = [NSHomeDirectory() stringByAppendingPathComponent:feedsFilePath];

  if (![[NSFileManager defaultManager] fileExistsAtPath:opmlFilePath]) {
      [[NSFileManager defaultManager] createFileAtPath:opmlFilePath contents:nil attributes:nil];
  }

  [opmlFileContentsString writeToFile:opmlFilePath atomically:YES encoding:NSUTF8StringEncoding error:NULL];

  NSURL *opmlFileURL = [NSURL fileURLWithPath:opmlFilePath];

  // HTML
  NSString *articlesFileName = [NSString stringWithFormat:@"PrivateReader-export-%@.html", uniqueTime];
  NSString *articlesFilePath = [NSString stringWithFormat:@"Documents/%@", articlesFileName];

  NSString *htmlFilePath = [NSHomeDirectory() stringByAppendingPathComponent:articlesFilePath];

  if (![[NSFileManager defaultManager] fileExistsAtPath:htmlFilePath]) {
      [[NSFileManager defaultManager] createFileAtPath:htmlFilePath contents:nil attributes:nil];
  }

  [htmlFileContentsString writeToFile:htmlFilePath atomically:YES encoding:NSUTF8StringEncoding error:NULL];

  NSURL *htmlFileURL = [NSURL fileURLWithPath:htmlFilePath];

  return @[
    [opmlFileURL path],
    [htmlFileURL path]
  ];
}


# pragma mark - User Defaults below

// Check if app has been setup (first run)
- (BOOL) internalHasSetup
{
  NSUserDefaults *userDefaults = [NSUserDefaults standardUserDefaults];

  [userDefaults synchronize];

  return [userDefaults boolForKey:@"initialSetup"];
}

// Set app setup (first run)
- (void)internalSetSetup :(BOOL *)newValue
{
  NSUserDefaults *userDefaults = [NSUserDefaults standardUserDefaults];

  [userDefaults setBool:newValue forKey:@"initialSetup"];

  [userDefaults synchronize];
}


#pragma mark - Core Data below

@synthesize managedObjectContext = _managedObjectContext;
@synthesize managedObjectModel = _managedObjectModel;
@synthesize persistentStoreCoordinator = _persistentStoreCoordinator;

- (NSURL *)applicationDocumentsDirectory
{
  return [[[NSFileManager defaultManager] URLsForDirectory:NSDocumentDirectory inDomains:NSUserDomainMask] lastObject];
}

// TODO: Call this when trying to "stop" the app
- (void)saveContext
{
  NSError *error = nil;
  NSManagedObjectContext *managedObjectContext = self.managedObjectContext;
  if (managedObjectContext != nil) {
    if ([managedObjectContext hasChanges] && ![managedObjectContext save:&error]) {
      NSLog(@"Unresolved error saving context %@, %@", error, [error userInfo]);
      abort();
    }
  }
}

- (NSManagedObjectContext *)managedObjectContext
{
  @synchronized (self) {
    if (_managedObjectContext != nil) {
      return _managedObjectContext;
    }

    NSPersistentStoreCoordinator *coordinator = [self persistentStoreCoordinator];
    if (coordinator != nil) {
      _managedObjectContext = [[NSManagedObjectContext alloc] initWithConcurrencyType:NSMainQueueConcurrencyType];
      [_managedObjectContext setPersistentStoreCoordinator:coordinator];
    }
    return _managedObjectContext;
  }
}

- (NSPersistentStoreCoordinator *)persistentStoreCoordinator
{
  @synchronized (self) {
    if (_persistentStoreCoordinator != nil) {
      return _persistentStoreCoordinator;
    }

    NSURL *storeURL = [[self applicationDocumentsDirectory] URLByAppendingPathComponent:@"DataDB.sqlite"];

    NSError *error = nil;
    _persistentStoreCoordinator = [[NSPersistentStoreCoordinator alloc] initWithManagedObjectModel:[self managedObjectModel]];
    if (![_persistentStoreCoordinator addPersistentStoreWithType:NSSQLiteStoreType configuration:nil URL:storeURL options:nil error:&error]) {
      // [_persistentStoreCoordinator removePersistentStore:[_persistentStoreCoordinator persistentStoreForURL:storeURL] error:nil];
      // [_persistentStoreCoordinator addPersistentStoreWithType:NSSQLiteStoreType configuration:nil URL:storeURL options:@{NSIgnorePersistentStoreVersioningOption:@YES, NSInferMappingModelAutomaticallyOption:@YES} error:&error];
      // NOTE: The commented code above can remove data to force new structure, don't ship as PROD

      NSLog(@"Unresolved error while setting a persistent store. %@, %@", error, [error userInfo]);
      abort();
    }

    return _persistentStoreCoordinator;
  }
}

- (NSManagedObjectModel *)managedObjectModel
{
  @synchronized (self) {
    if (_managedObjectModel != nil) {
      return _managedObjectModel;
    }
    NSURL *modelURL = [[NSBundle mainBundle] URLForResource:@"Data" withExtension:@"momd"];
    _managedObjectModel = [[NSManagedObjectModel alloc] initWithContentsOfURL:modelURL];
    return _managedObjectModel;
  }
}

@end

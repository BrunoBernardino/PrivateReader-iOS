//
//  RCTDataManager.h
//
//  Created by BrunoBernardino on 28/02/2017.
//  Uncopyright
//

#import <UIKit/UIKit.h>
#import <CoreData/CoreData.h>
#import "RCTBridgeModule.h"

@interface RCTDataManager : NSObject <RCTBridgeModule>

#pragma mark - Core Data stuff below


@property (readonly, strong, nonatomic) NSManagedObjectContext *managedObjectContext;
@property (readonly, strong, nonatomic) NSManagedObjectModel *managedObjectModel;
@property (readonly, strong, nonatomic) NSPersistentStoreCoordinator *persistentStoreCoordinator;

- (void)saveContext;
- (NSURL *)applicationDocumentsDirectory;
- (void) removeAllData;
// TODO: Add more methods

@end

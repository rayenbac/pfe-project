# Realtime Notification Service Fix - Favorite Property Error

## Problem
The realtime notification service was trying to access a `user` property on the favorite object, but the `IFavorite` interface uses `userId` instead of `user`.

## Error Message
```
src/Services/realtime-notification.service.ts:338:45 - error TS2339: Property 'user' does not exist on type 'IFavorite & Required<{ _id: ObjectId; }>'.
338             return favorites.map(fav => fav.user.toString()); 
                                                ~~~~
```

## Root Cause
The `IFavorite` interface structure:
```typescript
export interface IFavorite extends Document {
    _id: Types.ObjectId;
    userId: Types.ObjectId;           // Correct property name
    entityType?: 'agent' | 'property' | 'agency' | 'post';
    entityId?: Types.ObjectId;
    properties?: Types.ObjectId[];     // Backward compatibility
    // ... no 'user' property
}
```

The code was incorrectly accessing `fav.user` instead of `fav.userId`.

## Solution Applied

### Updated Realtime Notification Service
Modified `findUsersWithPropertyAsFavorite` method to:
1. Use the correct property name (`userId` instead of `user`)
2. Support both new and legacy favorite structures
3. Handle both `entityType`/`entityId` and `properties` array formats

```typescript
// Before (causing error)
private async findUsersWithPropertyAsFavorite(propertyId: string): Promise<string[]> {
    try {
        const { Favorite } = await import('../Models/favorite');
        const favorites = await Favorite.find({ property: propertyId });
        return favorites.map(fav => fav.user.toString());  // Error: 'user' doesn't exist
    } catch (error) {
        logger.error('Error finding users with property as favorite:', error);
        return [];
    }
}

// After (fixed)
private async findUsersWithPropertyAsFavorite(propertyId: string): Promise<string[]> {
    try {
        const { Favorite } = await import('../Models/favorite');
        const favorites = await Favorite.find({ 
            $or: [
                { entityType: 'property', entityId: propertyId },  // New structure
                { properties: propertyId }                         // Backward compatibility
            ]
        });
        return favorites.map(fav => fav.userId.toString());        // Correct property name
    } catch (error) {
        logger.error('Error finding users with property as favorite:', error);
        return [];
    }
}
```

## Benefits of the Fix

### 1. Correct Property Access ✅
- Uses `userId` instead of non-existent `user` property
- Matches the actual `IFavorite` interface

### 2. Comprehensive Query Support ✅
- Supports new `entityType`/`entityId` structure for property favorites
- Maintains backward compatibility with `properties` array
- Uses `$or` operator to check both formats

### 3. Future-Proof ✅
- Works with both legacy and new favorite data structures
- No breaking changes for existing favorite records

## Files Modified
- ✅ `src/Services/realtime-notification.service.ts` - Fixed property access and query logic

## Verification
The notification service should now:
1. ✅ Compile without TypeScript errors
2. ✅ Successfully find users who have favorited a property
3. ✅ Send notifications to the correct users when their favorite properties are updated
4. ✅ Work with both new and legacy favorite data structures

## Data Flow
```
Property Update → Find Favorites → Filter by Property ID → Get User IDs → Send Notifications
```

This ensures that when a property is updated, all users who have favorited that property will receive a notification.

# Locks

## Overview

The locks functionality in Control/ECS GUI provides a mechanism to ensure exclusive access to detectors during operations. This prevents conflicts when multiple users attempt to configure or control the same detector simultaneously. 

All LOCKs operations require an authenticated user session and moreover:
- Lock Operations require a role of minimum `Role.DETECTOR`.
- Lock Operations on `ALL` detectors require a minimum role of `Role.GLOBAL`.
- Forced Lock Operations require a role of minimum `Role.GLOBAL`.
- Forced Lock Operations on `ALL` detectors require a minimum role of `Role.ADMIN`.

## Lock Management

### Lock States

Each detector can be in one of the following lock states:
- **Released**: The detector is available to be locked by any user
- **Taken**: The detector is currently locked by a specific user

### Get Lock States

### Take Lock

Acquires a lock on a detector for the current user.

**Parameters**:
- `detectorId`: The individual detector identifier or `ALL` to lock all detectors (excluding TST)
- `action`: `TAKE`
- `shouldForce` (optional): Boolean flag to force taking the lock even if held by another user

**Behavior**:
- When `detectorId` is `ALL`, locks all detectors **except** TST
- If a lock is already held by another user and:
  - `shouldForce` is `false`, the request will fail.
  - `shouldForce` is `true` and the user has a role of at least `GLOBAL` for individual detector and at least `ADMIN` for detector `ALL`, the lock will be taken regardless of current ownership

### Release Lock

Releases a lock on a detector.

**Parameters**:
- `detectorId`: The detector identifier or `ALL` to release all locks (excluding TST)
- `action`: `RELEASE`
- `shouldForce` (optional): Boolean flag to force releasing the lock even if held by another user

**Behavior**:
- When `detectorId` is `ALL`, releases locks on all detectors **except** TST
- If a lock is already held by another user and:
  - `shouldForce` is `false`, the request will fail.
  - `shouldForce` is `true` and the user has a role of at least `GLOBAL` for individual detector and at least `ADMIN` for detector `ALL`, the lock will be released regardless of current ownership

## Special Cases

### TST Detector

The TST (test) detector is treated specially:
- When using `ALL` as the detector ID, TST is excluded from both TAKE and RELEASE operations
- TST must be locked/unlocked explicitly by using `TST` as the detector ID
- Moreover, front-end pages are also:
  - excluding TST from being displayed if on `Global` page
  - displaying TST at the end with separator if on `+Create` or `Locks` pages

### Error Handling

The lock controller handles the following error cases:
- Missing `detectorId` parameter → Returns `InvalidInputError`
- Invalid `action` parameter → Returns `InvalidInputError`
- Lock conflicts (when not forcing) → Error from LockService

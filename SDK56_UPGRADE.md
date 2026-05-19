# Expo SDK 53 → SDK 56 Upgrade Log

## Overview

| | Before | After |
|---|---|---|
| `expo` | ~53.0.13 | 56.0.0-preview.9 |
| `react-native` | 0.79.5 | 0.85.3 |
| `react` | 19.0.0 | 19.2.3 |
| `expo-router` | ~5.1.1 | ~56.1.3 |
| `react-native-reanimated` | ~3.17.4 | ~4.3.1 |
| iOS min target | 15.1 | 16.4 |

---

## Error 1 — expo-router peer dependency conflict

**Error:**
```
peer expo-constants@"^18.0.13" from expo-router@6.0.23
```

**Root Cause:**
SDK 56 mein expo-router ka versioning scheme change hua. SDK 53 mein `expo-router@5.x` tha, SDK 55 mein `6.x`. SDK 56 ke liye `expo-router` bhi `56.x` versioning follow karta hai — `6.x` nahi.

**Fix:**
```json
"expo-router": "~56.1.3"
```

---

## Error 2 — npm peer dependency conflict on fresh install

**Error:**
```
Could not resolve dependency: @expo/vector-icons@"^15.0.3"
Conflicting peer dependency: expo-font@56.0.3
```

**Root Cause:**
Old `node_modules` aur `package-lock.json` cached SDK 53 resolutions the jo SDK 56 packages se conflict kar rahe the.

**Fix:**
```bash
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

---

## Error 3 — react-native-worklets missing

**Error (expo-doctor):**
```
Missing peer dependency: react-native-worklets
Required by: react-native-reanimated
```

**Root Cause:**
`react-native-reanimated` 4.x (SDK 56 compatible) ne `react-native-worklets` ko alag package ke roop mein separate kar diya — pehle yeh bundled tha.

**Fix:**
```bash
npx expo install react-native-worklets -- --legacy-peer-deps
```

---

## Error 4 — app.json schema validation failures

**Error (expo-doctor):**
```
should NOT have additional property 'newArchEnabled'
android - should NOT have additional property 'edgeToEdgeEnabled'
```

**Root Cause:**
SDK 56 mein `newArchEnabled` aur `edgeToEdgeEnabled` fields `app.json` ke root/android level se hata diye gaye — ab yeh `Podfile.properties.json` se control hote hain.

**Fix:**
- `app.json` se `newArchEnabled: true` aur `edgeToEdgeEnabled: true` remove kiye
- `Podfile.properties.json` mein already `"newArchEnabled": "true"` tha

---

## Error 5 — iOS deployment target mismatch (SDK 56 requires iOS 16.4)

**Error:**
```
[!] expo was not linked: requires iOS 16.4 but app targets 15.1
[!] expo-constants was not linked: requires iOS 16.4 but app targets 15.1
... (20+ packages)
```

**Root Cause:**
SDK 56 ka minimum iOS deployment target 16.4 hai. Project 15.1 pe tha.

**Fix:**

1. `ios/Podfile.properties.json` mein add kiya:
```json
"ios.deploymentTarget": "16.4"
```

2. `ios/RNCourse.xcodeproj/project.pbxproj` mein sab 4 targets update kiye:
```
IPHONEOS_DEPLOYMENT_TARGET = 15.1  →  IPHONEOS_DEPLOYMENT_TARGET = 16.4
```

3. `ios/Podfile` mein `post_install` hook add kiya to force all pods to 16.4:
```ruby
installer.pods_project.targets.each do |target|
  target.build_configurations.each do |config|
    if config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'].to_f < 16.4
      config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '16.4'
    end
  end
end
```

---

## Error 6 — expo-av incompatible with SDK 56

**Error:**
```
'ExpoModulesCore/EXEventEmitter.h' file not found
(node_modules/expo-av/ios/EXAV/EXAV.h:10:9)
```

**Root Cause:**
`EXEventEmitter.h` header SDK 56 ke `ExpoModulesCore` se remove ho gaya. `expo-av` unmaintained hai aur SDK 56 compatible nahi.

**Fix:**
- `expo-av` remove kiya (app mein actually use nahi ho raha tha — `speechToTextService.js` dead code tha)
- SDK 56 ka official replacement `expo-audio` add kiya
- `app.json` se `expo-av` plugin bhi hataaya

```json
"expo-audio": "~56.0.4"
```

> **Note:** `expo-audio` bhi SDK 56 versioning follow karta hai — `0.4.x` nahi, `56.x` use karo.

---

## Error 7 — expo-audio wrong version (0.4.x vs 56.x)

**Error:**
```
EXFatal cannot find in scope
EXErrorWithMessage cannot find in scope
cannot convert value of type 'Promise.ResolveClosure'
(node_modules/expo-audio/ios/AudioModule.swift)
```

**Root Cause:**
`expo-audio@0.4.5` SDK 55 ka version tha. SDK 56 mein `expo-audio` bhi `56.x` versioning pe shift ho gaya hai.

**Fix:**
```json
"expo-audio": "~56.0.4"
```

---

## Error 8 — DerivedData cache 15.1 target hold kar raha tha

**Error:**
```
compiling for iOS 15.1, but module 'ExpoModulesCore' has
a minimum deployment target of iOS 16.4
```
(Podfile.properties.json aur project.pbxproj update karne ke baad bhi)

**Root Cause:**
Xcode ki DerivedData directory mein old 15.1 build artifacts cached the jo naye pod install ke baad bhi persist kar rahe the.

**Fix:**
```bash
rm -rf ~/Library/Developer/Xcode/DerivedData/RNCourse-*
cd ios && pod install
```

---

## Error 9 — AppDelegate.swift Swift 6 access level conflict

**Error:**
```
ambiguous implicit access level for import of 'Expo';
it is imported as 'internal' elsewhere
```
```
class cannot be declared public because its superclass is internal
```
```
cannot find 'bindReactNativeFactory' in scope
```

**Root Cause:**
Swift 6 (Xcode 16) mein module import access levels strict ho gaye. Original `AppDelegate.swift` mein:
- `public class AppDelegate: ExpoAppDelegate` — `public` class `internal` superclass inherit nahi kar sakti
- `public override func` — same issue

`ExpoModulesProvider.swift` (auto-generated by CocoaPods) `Expo` module ko `internal` import karta hai. Jab `AppDelegate.swift` mein bhi `import Expo` tha (implicitly internal) but class `public` thi, Swift 6 conflict throw karta hai.

**Fix:**
`AppDelegate.swift` se sabhi `public` modifiers remove kiye:

```swift
// Before
public class AppDelegate: ExpoAppDelegate { ... }
public override func application(...) -> Bool { ... }

// After  
class AppDelegate: ExpoAppDelegate { ... }
override func application(...) -> Bool { ... }
```

`import Expo` plain rakha (no access modifier).

---

## Error 10 — bindReactNativeFactory does not exist in SDK 56

**Error:**
```
cannot find 'bindReactNativeFactory' in scope
(ios/RNCourse/AppDelegate.swift:22:5)
```

**Root Cause:**
`bindReactNativeFactory` SDK 56 ke `ExpoAppDelegate` mein exist hi nahi karta — completely removed. SDK 56 mein `ExpoReactNativeFactory` directly `startReactNative(withModuleName:in:launchOptions:)` call karta hai aur lifecycle khud manage karta hai.

**Fix:**
`AppDelegate.swift` se yeh line remove ki:
```swift
bindReactNativeFactory(factory)  // ❌ remove
```

---

## Error 11 — expo-router 56 incompatible with react-navigation

**Error:**
```
As of SDK 56, expo-router is no longer compatible with react-navigation.
Import stack: app/_layout.tsx | import "@react-navigation/native"
```

**Root Cause:**
SDK 56 mein expo-router ने react-navigation dependency completely drop kar di. expo-router 56.x apna khud ka navigation system use karta hai.

**Files affected:**
- `app/_layout.tsx` — `ThemeProvider` from react-navigation
- `app/menu-screen.tsx` — `useNavigation`, `useRoute`
- `app/snacc-screen.tsx` — `useNavigation`, `navigation.navigate()`
- `components/HapticTab.tsx` — `BottomTabBarButtonProps`, `PlatformPressable`
- `components/ui/TabBarBackground.ios.tsx` — `useBottomTabBarHeight`

**Fix — expo-router equivalents:**

| react-navigation | SDK 56 expo-router |
|---|---|
| `useNavigation()` | `useRouter()` from `expo-router` |
| `useRoute()` | `useLocalSearchParams()` from `expo-router` |
| `navigation.goBack()` | `router.back()` |
| `navigation.navigate('screen', params)` | `router.push({ pathname: '/screen', params })` |
| `ThemeProvider` | Remove — expo-router handles theming |
| `useBottomTabBarHeight()` | `useSafeAreaInsets().bottom` |
| `PlatformPressable` | `Pressable` from react-native |
| `BottomTabBarButtonProps` | `PressableProps` from react-native |

---

## Key Learnings

1. **SDK 56 versioning change** — `expo-router`, `expo-audio` sab packages ab SDK number follow karte hain (`56.x`), pehle wala pattern (`5.x`, `0.4.x`) nahi
2. **iOS 16.4 minimum** — SDK 56 ka hard requirement hai, sirf `Podfile.properties.json` kaafi nahi — Xcode project file + post_install hook dono chahiye
3. **expo-av deprecated** — SDK 56 mein `expo-audio` (audio) aur `expo-video` (video) use karo
4. **reanimated 4.x** — `react-native-worklets` alag se install karna padega
5. **Swift 6** — `public` access modifiers AppDelegate mein nahi chahiye — remove karo
6. **DerivedData** — deployment target change ke baad hamesha clean karo
7. **Clean install** — SDK upgrade ke time `node_modules` + `package-lock.json` delete karke fresh install karo

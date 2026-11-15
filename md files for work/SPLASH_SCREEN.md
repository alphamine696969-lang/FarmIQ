# Adding the Farm IQ splash animation to your app

**File:** `farmiq-splash.mp4` (1080×1920, 60 fps, 4.2 s, no audio)
**Background color:** `#F5F4EA`

---

## How it works (all platforms)

Your app shows two things in a row:

1. **Native launch screen**: a plain `#F5F4EA` screen with **no logo**. The OS shows this instantly while the app starts.
2. **Animated splash screen**: the first screen inside your app. It plays `farmiq-splash.mp4` once, then goes to your home screen.

The first frame of the video is also plain `#F5F4EA`, so the hand-off from step 1 to step 2 is seamless. That is why the native launch screen must be a plain color with no logo, because a static logo would pop before the animation begins.

---

## Step 1: Copy the video into your project

| Platform | Location |
|---|---|
| Flutter | `assets/video/farmiq-splash.mp4` |
| React Native / Expo | `assets/farmiq-splash.mp4` |
| Android (native) | `app/src/main/res/raw/farmiq_splash.mp4` (lowercase, underscores only) |
| iOS (native) | Add to the Xcode project, tick your app target |
| Web | `public/farmiq-splash.mp4` |

---

## Step 2: Set the native launch screen color

### Flutter
```bash
flutter pub add flutter_native_splash
```
Add to `pubspec.yaml`:
```yaml
flutter_native_splash:
  color: "#F5F4EA"
  android_12:
    color: "#F5F4EA"
```
Then run:
```bash
dart run flutter_native_splash:create
```

### Expo (React Native)
In `app.json`:
```json
{
  "expo": {
    "plugins": [
      ["expo-splash-screen", { "backgroundColor": "#F5F4EA" }]
    ]
  }
}
```

### Android (native)
`res/values/themes.xml`:
```xml
<style name="Theme.FarmIQ.Starting" parent="Theme.SplashScreen">
    <item name="windowSplashScreenBackground">#F5F4EA</item>
    <item name="windowSplashScreenAnimatedIcon">@android:color/transparent</item>
    <item name="postSplashScreenTheme">@style/Theme.FarmIQ</item>
</style>
```
Use `Theme.FarmIQ.Starting` as the theme of your launcher activity, and call `installSplashScreen()` before `super.onCreate()`.

### iOS (native)
In `LaunchScreen.storyboard`, set the main view's background to `#F5F4EA` and remove any images or labels.

---

## Step 3: Play the video

### Flutter

```bash
flutter pub add video_player
```
`pubspec.yaml`:
```yaml
flutter:
  assets:
    - assets/video/farmiq_splash.mp4
```

```dart
import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});
  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  late final VideoPlayerController _c;
  bool _done = false;

  @override
  void initState() {
    super.initState();
    _c = VideoPlayerController.asset('assets/video/farmiq-splash.mp4')
      ..initialize().then((_) {
        setState(() {});
        _c.play();
      });
    _c.addListener(() {
      final v = _c.value;
      if (!_done && v.isInitialized && v.position >= v.duration) {
        _done = true;
        _goHome();
      }
    });
  }

  void _goHome() {
    Navigator.of(context).pushReplacementNamed('/home');
  }

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F4EA),
      body: _c.value.isInitialized
          ? SizedBox.expand(
              child: FittedBox(
                fit: BoxFit.contain, // keeps the logo uncropped on every screen
                child: SizedBox(
                  width: _c.value.size.width,
                  height: _c.value.size.height,
                  child: VideoPlayer(_c),
                ),
              ),
            )
          : const SizedBox.shrink(),
    );
  }
}
```
Set `SplashScreen` as your first route.

### Expo (React Native)

```bash
npx expo install expo-video
```

```tsx
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';

export default function Splash({ onFinish }: { onFinish: () => void }) {
  const player = useVideoPlayer(require('../assets/farmiq-splash.mp4'), (p) => {
    p.loop = false;
    p.muted = true;
    p.play();
  });

  useEffect(() => {
    const sub = player.addListener('playToEnd', onFinish);
    return () => sub.remove();
  }, [player, onFinish]);

  return (
    <View style={styles.root}>
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit="contain"
        nativeControls={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({ root: { flex: 1, backgroundColor: '#F5F4EA' } });
```
Render `<Splash onFinish={() => router.replace('/home')} />` as your first screen.
(Bare React Native: use `react-native-video` with `resizeMode="contain"` and `onEnd`.)

### Android (native, Kotlin)

`res/layout/activity_splash.xml`:
```xml
<FrameLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:background="#F5F4EA">
    <VideoView
        android:id="@+id/video"
        android:layout_width="match_parent"
        android:layout_height="match_parent"
        android:layout_gravity="center" />
</FrameLayout>
```

```kotlin
class SplashActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        installSplashScreen()
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_splash)

        val video = findViewById<VideoView>(R.id.video)
        video.setVideoURI(Uri.parse("android.resource://$packageName/${R.raw.farmiq_splash}"))
        video.setOnPreparedListener { it.isLooping = false; video.start() }
        video.setOnCompletionListener {
            startActivity(Intent(this, MainActivity::class.java))
            finish()
        }
    }
}
```

### iOS (native, SwiftUI)

```swift
import SwiftUI
import AVKit

struct SplashView: View {
    var onFinish: () -> Void
    @State private var player = AVPlayer(
        url: Bundle.main.url(forResource: "farmiq-splash", withExtension: "mp4")!
    )

    var body: some View {
        PlayerLayerView(player: player)
            .background(Color(red: 245/255, green: 244/255, blue: 234/255))
            .ignoresSafeArea()
            .onAppear {
                player.isMuted = true
                player.play()
                NotificationCenter.default.addObserver(
                    forName: .AVPlayerItemDidPlayToEndTime,
                    object: player.currentItem, queue: .main
                ) { _ in onFinish() }
            }
    }
}

struct PlayerLayerView: UIViewRepresentable {
    let player: AVPlayer
    func makeUIView(context: Context) -> UIView {
        let v = UIView()
        let layer = AVPlayerLayer(player: player)
        layer.videoGravity = .resizeAspect
        v.layer.addSublayer(layer)
        return v
    }
    func updateUIView(_ v: UIView, context: Context) {
        v.layer.sublayers?.first?.frame = v.bounds
    }
}
```

### Web / PWA
```html
<div id="splash" style="position:fixed;inset:0;background:#F5F4EA;display:grid;place-items:center">
  <video id="v" src="/farmiq-splash.mp4" autoplay muted playsinline
         style="max-width:100%;max-height:100%"></video>
</div>
<script>
  document.getElementById('v').addEventListener('ended', () => {
    document.getElementById('splash').remove();
  });
</script>
```
`muted` and `playsinline` are required, or mobile browsers will block autoplay.

---

## Step 4: Polish (recommended)

- **Don't make users wait twice.** Start loading your data (auth, config) while the video plays. When the video ends, go to the home screen immediately if loading is done. Only show a small loader if it isn't.
- **Show it on cold start only**, not every time the app returns from the background.
- **Reduced motion:** if the user has reduce-motion turned on, skip the video and show the static logo for about 1 second.
- **Add a safety timeout** (about 6 s). If the video fails to load or play, go to the home screen anyway so users never get stuck.
- **Dark mode:** the video is light-themed. Keep the splash light in both modes, or ask for a dark version.
- **Aspect ratio:** the video is 9:16. Use "contain" / "aspect fit" (as in the examples) so nothing is cropped on unusual screens. The background color matches, so the edges are invisible.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| White or black flash before the animation | Native launch screen isn't exactly `#F5F4EA`, or it still has a logo |
| Video doesn't autoplay on web | Add `muted` and `playsinline` |
| Android can't find the video | File name in `res/raw` must be lowercase with underscores |
| Slight stutter on first frames | Initialize the player early (before the first screen draws) |
| Logo looks cropped | Use contain / aspect fit, not cover / fill |

---

## Want it even smoother?

A video works well, but a **native animation** (Lottie, Rive, or native Flutter/Compose/SwiftUI) is crisper at every resolution, supports dark mode, and has a smaller file size. The animation is already built from separate layers (arcs, sprout, letters, IQ leaf), so it can be ported. Tell me your stack and I'll port it.
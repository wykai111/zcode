const { withMainActivity, withAppDelegate } = require('@expo/config-plugins');

/**
 * Expo Config Plugin to prevent screen recording and screenshots.
 * Android: Sets WindowManager.LayoutParams.FLAG_SECURE in MainActivity.
 * iOS: Checks for screen capture status and terminates if detected.
 */
const withScreenProtection = (config) => {
  // --- Android ---
  config = withMainActivity(config, (cfg) => {
    if (cfg.modResults.language === 'kotlin') {
      let content = cfg.modResults.contents;

      // Add imports
      if (!content.includes('android.view.WindowManager')) {
        content = content.replace(/(package .*)/, '$1\n\nimport android.view.WindowManager');
      }

      // Set FLAG_SECURE in onCreate
      if (!content.includes('WindowManager.LayoutParams.FLAG_SECURE')) {
        const onCreateMatch = /(override fun onCreate\(savedInstanceState: Bundle\?\) \{)/;
        if (onCreateMatch.test(content)) {
          content = content.replace(onCreateMatch, '$1\n    window.addFlags(WindowManager.LayoutParams.FLAG_SECURE)');
        }
      }

      cfg.modResults.contents = content;
    }
    return cfg;
  });

  // --- iOS ---
  config = withAppDelegate(config, (cfg) => {
    let content = cfg.modResults.contents;

    // 1. Add Screen Capture Check logic after app launch
    const didFinishLaunchingReturn = /return \[super application:application didFinishLaunchingWithOptions:launchOptions\];/;
    const screenCaptureCheck = `
  // Screen Recording Protection Overlay
  UIView *protectionOverlay = [[UIView alloc] initWithFrame:[UIScreen mainScreen].bounds];
  protectionOverlay.backgroundColor = [UIColor blackColor];
  protectionOverlay.tag = 9999;

  UILabel *label = [[UILabel alloc] init];
  label.text = @"Screen recording is not allowed for security reasons.";
  label.textColor = [UIColor whiteColor];
  label.textAlignment = NSTextAlignmentCenter;
  label.numberOfLines = 0;
  label.frame = protectionOverlay.bounds;
  [protectionOverlay addSubview:label];

  void (^updateProtection)(void) = ^{
    dispatch_async(dispatch_get_main_queue(), ^{
      UIWindow *window = [UIApplication sharedApplication].keyWindow;
      if (@available(iOS 11.0, *)) {
        if ([UIScreen mainScreen].isCaptured) {
          if (![window viewWithTag:9999]) {
            [window addSubview:protectionOverlay];
          }
        } else {
          UIView *overlay = [window viewWithTag:9999];
          if (overlay) {
            [overlay removeFromSuperview];
          }
        }
      }
    });
  };

  if (@available(iOS 11.0, *)) {
    updateProtection();
    [[NSNotificationCenter defaultCenter] addObserverForName:UIScreenCapturedDidChangeNotification
                                                      object:nil
                                                       queue:[NSOperationQueue mainQueue]
                                                  usingBlock:^(NSNotification *notification) {
      updateProtection();
    }];
  }
`;

    if (!content.includes('UIScreenCapturedDidChangeNotification')) {
      content = content.replace(didFinishLaunchingReturn, `${screenCaptureCheck}\n  $&`);
    }

    cfg.modResults.contents = content;
    return cfg;
  });

  return config;
};

module.exports = withScreenProtection;

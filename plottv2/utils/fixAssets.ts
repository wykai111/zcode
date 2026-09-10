/**
 * 修复 Release 模式下从解密 Bundle 加载时图片不显示的问题。
 * 
 * 问题原因：
 * 当 JS Bundle 从文件系统加载时（如解密后的临时文件），React Native 会尝试
 * 从 Bundle 同级目录加载图片，但那里没有图片资源。
 * 
 * 解决方案：
 * - Android: 使用 resourceIdentifierWithoutScale() 强制通过资源标识符加载
 * - iOS: 通过 AssetPathModule 获取 main bundle 路径,构造正确的资源 URL
 */

import { Platform, NativeModules } from 'react-native';
import resolveAssetSource from 'react-native/Libraries/Image/resolveAssetSource';

// 获取 iOS main bundle 路径(同步)
let iosMainBundlePath: string | null = null;

if (Platform.OS === 'ios' && !__DEV__) {
  try {
    const { AssetPathModule } = NativeModules;
    if (AssetPathModule?.getMainBundlePathSync) {
      iosMainBundlePath = AssetPathModule.getMainBundlePathSync();
      console.log('[fixAssets] iOS main bundle path:', iosMainBundlePath);
    }
  } catch (e) {
    console.warn('[fixAssets] Failed to get iOS main bundle path:', e);
  }
}

if (!__DEV__) {
  resolveAssetSource.setCustomSourceTransformer((resolver: any) => {
    if (Platform.OS === 'android') {
      // Android: 强制使用资源标识符
      return resolver.resourceIdentifierWithoutScale();
    } else if (Platform.OS === 'ios') {
      // iOS: 构造基于 main bundle 的资源 URL
      if (iosMainBundlePath) {
        const asset = resolver.asset;
        if (asset) {
          // 获取缩放后的资源路径 (如 assets/icons/icon_home.png)
          const scaledPath = resolver.scaledAssetPath();
          // 构造完整的 file:// URL,指向 main bundle
          const uri = `file://${iosMainBundlePath}/${scaledPath.uri}`;
          return {
            ...scaledPath,
            uri,
          };
        }
      }
      // 回退到默认行为
      return resolver.scaledAssetPath();
    }
    return resolver.defaultAsset();
  });
}

export {};

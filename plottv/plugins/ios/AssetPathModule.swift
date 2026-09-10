import Foundation
import React

@objc(AssetPathModule)
class AssetPathModule: NSObject {
    
    @objc static func requiresMainQueueSetup() -> Bool {
        return false
    }
    
    @objc static func moduleName() -> String! {
        return "AssetPathModule"
    }
    
    /// 返回 main bundle 的路径,用于 JS 端修正资源加载路径
    @objc func getMainBundlePath(_ resolve: @escaping RCTPromiseResolveBlock,
                                  rejecter reject: @escaping RCTPromiseRejectBlock) {
        resolve(Bundle.main.bundlePath)
    }
    
    /// 同步返回 main bundle 路径
    @objc func getMainBundlePathSync() -> String {
        return Bundle.main.bundlePath
    }
}

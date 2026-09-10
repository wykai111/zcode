#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(AssetPathModule, NSObject)

RCT_EXTERN_METHOD(getMainBundlePath:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN__BLOCKING_SYNCHRONOUS_METHOD(getMainBundlePathSync)

@end

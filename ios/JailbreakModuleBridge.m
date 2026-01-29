//
//  JailbreakModuleBridge.m
//  qubetics_app
//

#import <React/RCTBridgeModule.h>

// If the implementation of JailbreakModule is in Swift, ensure the Swift-generated header is available to ObjC.
// Remove or adjust the following import if not using Swift for the module implementation.
#if __has_include("qubetics_app-Swift.h")
#import "qubetics_app-Swift.h"
#endif

@interface RCT_EXTERN_MODULE(JailbreakModule, NSObject)

RCT_EXTERN_METHOD(isJailbroken:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end


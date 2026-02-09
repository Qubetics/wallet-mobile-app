//
//  JailbreakModuleBridge.m
//  qubetics_app
//

#import <Foundation/Foundation.h>
#import <React/RCTBridgeModule.h>

// If the implementation of JailbreakModule is in Swift, ensure the Swift-generated header is available to ObjC.
// Remove or adjust the following import if not using Swift for the module implementation.
#if __has_include("qubetics_app-Swift.h")
#import "qubetics_app-Swift.h"
#endif

// Use a category interface to avoid redefining the class when bridging to Swift/ObjC
@interface JailbreakModule (ReactNative) <RCTBridgeModule>
@end

@implementation JailbreakModule (ReactNative)

RCT_EXPORT_MODULE();

RCT_REMAP_METHOD(isJailbroken,
                 isJailbrokenWithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  // Forward to the Swift/ObjC implementation if available
#ifdef __has_include
#if __has_include("qubetics_app-Swift.h")
  [self isJailbrokenWithResolver:resolve rejecter:reject];
#else
  if (resolve) { resolve(@(NO)); }
#endif
#else
  if (resolve) { resolve(@(NO)); }
#endif
}
@end


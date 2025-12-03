//
//  GenerateWalletBridge.m
//  galawallet
//
//  Created by Abhishek-1112 on 23/01/25.
//


#import "SystemClockModuleBridge.h"
#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(SystemClockModule, NSObject)

RCT_EXTERN_METHOD(
  getSystemClocks:
    (RCTPromiseResolveBlock)resolve
  rejecter:
    (RCTPromiseRejectBlock)reject
)

@end

@implementation SystemClockModuleBridge
@end

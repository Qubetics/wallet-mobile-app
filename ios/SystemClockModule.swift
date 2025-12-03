//
//  GenerateWallet.swift
//  galawallet
//
//  Created by Abhishek-1112 on 23/01/25.
//
import Foundation
import React

@objc(SystemClockModule)
class SystemClockModule: NSObject {

    @objc static func requiresMainQueueSetup() -> Bool {
        return false
    }

@objc
func getSystemClocks(
    _ resolve: RCTPromiseResolveBlock,
    rejecter reject: RCTPromiseRejectBlock
) {
  let monotonic = clock_gettime_nsec_np(CLOCK_MONOTONIC)
  resolve(monotonic)
}
}

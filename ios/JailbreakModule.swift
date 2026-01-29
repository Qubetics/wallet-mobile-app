//
//  JailbreakModule.swift
//  qubetics_app
//
//  Audit: Check for existence of common files/directories associated with jailbroken devices.
//

import Foundation
import React

@objc(JailbreakModule)
class JailbreakModule: NSObject {

    @objc static func requiresMainQueueSetup() -> Bool {
        return false
    }

    /// Paths commonly present on jailbroken iOS (audit list + common variants).
    private static let jailbreakPaths = [
        "/Applications/Cydia.app",
        "/Applications/FakeCarrier.app",
        "/Applications/Icy.app",
        "/Applications/MxTube.app",
        "/Applications/RockApp.app",
        "/Applications/SBSettings.app",
        "/Applications/WinterBoard.app",
        "/Library/MobileSubstrate/MobileSubstrate.dylib",
        "/bin/bash",
        "/usr/sbin/sshd",
        "/etc/apt",
        "/private/var/lib/apt/",
        "/private/var/lib/cydia",
        "/private/var/stash",
        "/usr/libexec/sftp-server",
        "/usr/bin/ssh"
    ]

    /// Returns true if device appears jailbroken (any of the paths exist).
    @objc
    func isJailbroken(
        _ resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        let jailbroken = Self.checkJailbreakPaths()
        resolve(jailbroken)
    }

    private static func checkJailbreakPaths() -> Bool {
        let fileManager = FileManager.default
        for path in jailbreakPaths {
            if fileManager.fileExists(atPath: path) {
                return true
            }
        }
        return false
    }
}

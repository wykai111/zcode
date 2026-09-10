import Foundation
import CommonCrypto
import React

@objc public class BundleDecryptor: NSObject {
    
    /// 返回 main bundle 的资源基础路径 (用于 JS 端修正资源路径)
    @objc public static func getMainBundleAssetsPath() -> String {
        return Bundle.main.bundlePath
    }

    @objc public static func calculateHash(for fileURL: URL) -> String? {
        guard let data = try? Data(contentsOf: fileURL) else { return nil }
        var hash = [UInt8](repeating: 0, count: Int(CC_SHA256_DIGEST_LENGTH))
        data.withUnsafeBytes {
            _ = CC_SHA256($0.baseAddress, CC_LONG(data.count), &hash)
        }
        return hash.map { String(format: "%02x", $0) }.joined()
    }

    @objc public static func getCacheDirectory() -> String {
        let paths = NSSearchPathForDirectoriesInDomains(.applicationSupportDirectory, .userDomainMask, true)
        let appSupportDir = paths[0]
        let bundleCacheDir = (appSupportDir as NSString).appendingPathComponent("BundleCache")

        if !FileManager.default.fileExists(atPath: bundleCacheDir) {
            try? FileManager.default.createDirectory(atPath: bundleCacheDir, withIntermediateDirectories: true, attributes: nil)
        }

        return bundleCacheDir
    }

    @objc public static func getDecryptedBundleURL() -> URL? {
        guard let bundleURL = Bundle.main.url(forResource: "main", withExtension: "jsbundle") else {
            return nil
        }

        #if DEBUG
        return bundleURL
        #endif

        guard let bundleHash = calculateHash(for: bundleURL) else {
            return bundleURL
        }

        let cacheDir = getCacheDirectory()
        let cacheFileName = "\(bundleHash).jsbundle"
        let cachedFilePath = (cacheDir as NSString).appendingPathComponent(cacheFileName)

        if FileManager.default.fileExists(atPath: cachedFilePath) {
            return URL(fileURLWithPath: cachedFilePath)
        }

        guard let data = try? Data(contentsOf: bundleURL), data.count >= 37 else {
            return bundleURL
        }

        let bytes = [UInt8](data)
        if bytes[0] != 0x44 || bytes[1] != 0x52 || bytes[2] != 0x4D || bytes[3] != 0x41 {
            return bundleURL
        }

        let keyLen = Int(bytes[4])
        let key = data.subdata(in: 5..<(5 + keyLen))
        let iv = data.subdata(in: (5 + keyLen)..<(21 + keyLen))
        let encryptedData = data.subdata(in: (21 + keyLen)..<data.count)

        if let decryptedData = decrypt(data: encryptedData, key: key, iv: iv) {
            try? decryptedData.write(to: URL(fileURLWithPath: cachedFilePath), options: .atomic)
            return URL(fileURLWithPath: cachedFilePath)
        }

        return bundleURL
    }

    private static func decrypt(data: Data, key: Data, iv: Data) -> Data? {
        let bufferSize = data.count + kCCBlockSizeAES128
        var buffer = Data(count: bufferSize)
        var numBytesDecrypted: Int = 0

        let status = buffer.withUnsafeMutableBytes { bufferBytes in
            data.withUnsafeBytes { dataBytes in
                key.withUnsafeBytes { keyBytes in
                    iv.withUnsafeBytes { ivBytes in
                        CCCrypt(
                            CCOperation(kCCDecrypt),
                            CCAlgorithm(kCCAlgorithmAES),
                            CCOptions(kCCOptionPKCS7Padding),
                            keyBytes.baseAddress, key.count,
                            ivBytes.baseAddress,
                            dataBytes.baseAddress, data.count,
                            bufferBytes.baseAddress, bufferSize,
                            &numBytesDecrypted
                        )
                    }
                }
            }
        }

        if status == kCCSuccess {
            buffer.count = numBytesDecrypted
            return buffer
        }

        return nil
    }
}

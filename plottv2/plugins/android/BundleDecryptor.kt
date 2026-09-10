package com.plottv.atv
import android.content.Context
import java.io.File
import java.security.MessageDigest
import javax.crypto.Cipher
import javax.crypto.spec.IvParameterSpec
import javax.crypto.spec.SecretKeySpec

object BundleDecryptor {
    fun getDecryptedBundlePath(context: Context): String? {
        val bundleName = "index.android.bundle"

        try {
            context.assets.open(bundleName).use { input ->
                val bytes = input.readBytes()
                // 检查是否是加密文件（以DRMA开头）
                if (bytes.size < 37 || bytes[0] != 0x44.toByte() || bytes[1] != 0x52.toByte()) {
                    return null // 不是加密文件
                }

                val keyLen = bytes[4].toInt() and 0xFF
                val key = bytes.copyOfRange(5, 5 + keyLen)
                val iv = bytes.copyOfRange(5 + keyLen, 21 + keyLen)
                val encryptedData = bytes.copyOfRange(21 + keyLen, bytes.size)

                val cipher = Cipher.getInstance("AES/CBC/PKCS5Padding")
                cipher.init(Cipher.DECRYPT_MODE, SecretKeySpec(key, "AES"), IvParameterSpec(iv))
                val decryptedBundle = cipher.doFinal(encryptedData)

                // 创建临时文件而不是缓存文件
                val tempDir = File(context.cacheDir, "JetpackCompose").apply { mkdirs() }
                val tempFile = File.createTempFile("decrypted_bundle", ".bundle", tempDir)
                tempFile.writeBytes(decryptedBundle)

                return tempFile.absolutePath
            }
        } catch (e: Exception) {
            e.printStackTrace()
            return null
        }
    }
}
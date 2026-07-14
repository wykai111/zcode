package com.example.strikeforce

import android.os.Bundle
import android.text.InputType
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import android.widget.EditText
import android.widget.ImageView
import android.widget.Button
import android.widget.ProgressBar
import android.widget.TextView

class GameLoginActivity : AppCompatActivity() {

    private var passwordVisible = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_game_login)

        // Wire up password visibility toggle
        val etPassword = findViewById<EditText>(R.id.edit_password)
        val btnToggle = findViewById<ImageView>(R.id.btn_password_toggle)

        btnToggle?.setOnClickListener {
            passwordVisible = !passwordVisible
            if (passwordVisible) {
                etPassword.inputType = InputType.TYPE_TEXT_VARIATION_VISIBLE_PASSWORD
                btnToggle.setImageResource(R.drawable.ic_eye)
            } else {
                etPassword.inputType =
                    InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_VARIATION_PASSWORD
                btnToggle.setImageResource(R.drawable.ic_eye_off)
            }
            etPassword.setSelection(etPassword.text?.length ?: 0)
        }

        // Login button
        val btnLogin = findViewById<Button>(R.id.btn_login)
        btnLogin?.setOnClickListener {
            val account = findViewById<EditText>(R.id.edit_account)?.text?.toString()?.trim() ?: ""
            val password = etPassword.text?.toString()?.trim() ?: ""

            if (account.isEmpty()) {
                Toast.makeText(this, "请输入账号", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }
            if (password.isEmpty()) {
                Toast.makeText(this, "请输入密码", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }
            Toast.makeText(this, "部署中...", Toast.LENGTH_SHORT).show()
        }

        // Third-party login buttons
        findViewById<Button>(R.id.btn_wechat)?.setOnClickListener {
            Toast.makeText(this, "微信登录", Toast.LENGTH_SHORT).show()
        }
        findViewById<Button>(R.id.btn_qq)?.setOnClickListener {
            Toast.makeText(this, "QQ 登录", Toast.LENGTH_SHORT).show()
        }
        findViewById<Button>(R.id.btn_guest)?.setOnClickListener {
            Toast.makeText(this, "游客登录", Toast.LENGTH_SHORT).show()
        }

        // Links
        findViewById<TextView>(R.id.link_register)?.setOnClickListener {
            Toast.makeText(this, "注册功能开发中", Toast.LENGTH_SHORT).show()
        }
        findViewById<TextView>(R.id.link_forgot)?.setOnClickListener {
            Toast.makeText(this, "密码找回功能开发中", Toast.LENGTH_SHORT).show()
        }
    }
}

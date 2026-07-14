package com.example.loginapp

import android.content.Intent
import android.os.Bundle
import android.text.InputType
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.example.loginapp.databinding.ActivityRegisterBinding
import java.util.regex.Pattern

class RegisterActivity : AppCompatActivity() {

    private lateinit var binding: ActivityRegisterBinding
    private var passwordVisible = false
    private var confirmVisible = false

    companion object {
        private val EMAIL_PATTERN = Pattern.compile(
            "[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}"
        )
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityRegisterBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupPasswordToggles()
        setupClickListeners()
    }

    private fun setupPasswordToggles() {
        binding.textInputPassword.setEndIconOnClickListener {
            passwordVisible = !passwordVisible
            if (passwordVisible) {
                binding.etPassword.inputType = InputType.TYPE_TEXT_VARIATION_VISIBLE_PASSWORD
            } else {
                binding.etPassword.inputType =
                    InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_VARIATION_PASSWORD
            }
            binding.etPassword.setSelection(binding.etPassword.text?.length ?: 0)
        }

        binding.textInputConfirmPassword.setEndIconOnClickListener {
            confirmVisible = !confirmVisible
            if (confirmVisible) {
                binding.etConfirmPassword.inputType = InputType.TYPE_TEXT_VARIATION_VISIBLE_PASSWORD
            } else {
                binding.etConfirmPassword.inputType =
                    InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_VARIATION_PASSWORD
            }
            binding.etConfirmPassword.setSelection(binding.etConfirmPassword.text?.length ?: 0)
        }
    }

    private fun setupClickListeners() {
        binding.btnRegister.setOnClickListener {
            if (validateInput()) {
                val username = binding.etUsername.text.toString().trim()
                Toast.makeText(this, "Account created successfully!", Toast.LENGTH_SHORT).show()
                val intent = Intent(this, HomeActivity::class.java)
                intent.putExtra("username", username)
                intent.putExtra("source", "register")
                startActivity(intent)
                finish()
            }
        }

        binding.tvLogin.setOnClickListener {
            finish() // Go back to LoginActivity
        }
    }

    private fun validateInput(): Boolean {
        val username = binding.etUsername.text.toString().trim()
        val email = binding.etEmail.text.toString().trim()
        val password = binding.etPassword.text.toString().trim()
        val confirmPassword = binding.etConfirmPassword.text.toString().trim()

        // Validate username
        if (username.isEmpty()) {
            binding.textInputUsername.error = "Username cannot be empty"
            return false
        }
        if (username.length < 3) {
            binding.textInputUsername.error = "Username must be at least 3 characters"
            return false
        }
        binding.textInputUsername.error = null

        // Validate email
        if (email.isEmpty()) {
            binding.textInputEmail.error = "Email cannot be empty"
            return false
        }
        if (!EMAIL_PATTERN.matcher(email).matches()) {
            binding.textInputEmail.error = "Please enter a valid email"
            return false
        }
        binding.textInputEmail.error = null

        // Validate password
        if (password.isEmpty()) {
            binding.textInputPassword.error = "Password cannot be empty"
            return false
        }
        if (password.length < 6) {
            binding.textInputPassword.error = "Password must be at least 6 characters"
            return false
        }
        binding.textInputPassword.error = null

        // Validate confirm password
        if (confirmPassword.isEmpty()) {
            binding.textInputConfirmPassword.error = "Please confirm your password"
            return false
        }
        if (password != confirmPassword) {
            binding.textInputConfirmPassword.error = "Passwords do not match"
            return false
        }
        binding.textInputConfirmPassword.error = null

        return true
    }
}

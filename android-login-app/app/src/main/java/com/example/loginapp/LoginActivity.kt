package com.example.loginapp

import android.content.Intent
import android.os.Bundle
import android.text.InputType
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.example.loginapp.databinding.ActivityLoginBinding
import java.util.regex.Pattern

class LoginActivity : AppCompatActivity() {

    private lateinit var binding: ActivityLoginBinding
    private var passwordVisible = false

    companion object {
        private val EMAIL_PATTERN = Pattern.compile(
            "[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}"
        )
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityLoginBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupPasswordToggle()
        setupClickListeners()
    }

    private fun setupPasswordToggle() {
        binding.textInputPassword.setEndIconOnClickListener {
            passwordVisible = !passwordVisible
            if (passwordVisible) {
                binding.etPassword.inputType = InputType.TYPE_TEXT_VARIATION_VISIBLE_PASSWORD
            } else {
                binding.etPassword.inputType =
                    InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_VARIATION_PASSWORD
            }
            // Move cursor to end
            binding.etPassword.setSelection(binding.etPassword.text?.length ?: 0)
        }
    }

    private fun setupClickListeners() {
        binding.btnLogin.setOnClickListener {
            if (validateInput()) {
                val email = binding.etEmail.text.toString().trim()
                Toast.makeText(this, "Login successful!", Toast.LENGTH_SHORT).show()
                val intent = Intent(this, HomeActivity::class.java)
                intent.putExtra("email", email)
                intent.putExtra("source", "login")
                startActivity(intent)
                finish()
            }
        }

        binding.tvSignUp.setOnClickListener {
            startActivity(Intent(this, RegisterActivity::class.java))
        }

        binding.tvForgotPassword.setOnClickListener {
            Toast.makeText(this, "Password reset link sent to your email", Toast.LENGTH_SHORT).show()
        }
    }

    private fun validateInput(): Boolean {
        val email = binding.etEmail.text.toString().trim()
        val password = binding.etPassword.text.toString().trim()

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

        return true
    }
}

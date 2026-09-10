package com.followman.admin.admin.controller;

import com.followman.admin.admin.dto.AuthDtos.LoginRequest;
import com.followman.admin.admin.dto.AuthDtos.LoginResult;
import com.followman.admin.admin.service.AuthService;
import com.followman.admin.auth.AdminContext;
import com.followman.admin.auth.RequirePerm;
import com.followman.admin.common.BizException;
import com.followman.admin.common.Result;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/** 登录 / 退出 / 验证码 / 当前用户 */
@RestController
@RequestMapping("/api/admin/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /** 图形验证码 */
    @GetMapping("/captcha")
    public Result<Map<String, String>> captcha() {
        return Result.ok(authService.captcha());
    }

    /** 管理员登录（带验证码） */
    @PostMapping("/login")
    public Result<LoginResult> login(@Valid @RequestBody LoginRequest req, HttpServletRequest request) {
        return Result.ok(authService.login(req, request));
    }

    /** 退出登录 */
    @PostMapping("/logout")
    public Result<Void> logout() {
        return Result.ok();
    }

    /** 当前登录管理员信息 + 菜单 + 权限 */
    @GetMapping("/me")
    public Result<LoginResult> me() {
        AdminContext.Current current = AdminContext.get();
        if (current == null) {
            throw new BizException(401, "未登录");
        }
        return Result.ok(authService.me(current.getId()));
    }
}

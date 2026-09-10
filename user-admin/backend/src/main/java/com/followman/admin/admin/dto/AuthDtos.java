package com.followman.admin.admin.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.List;
import java.util.Map;
import java.util.Set;

public class AuthDtos {

    @Data
    public static class LoginRequest {
        @NotBlank(message = "请输入账号")
        private String username;
        @NotBlank(message = "请输入密码")
        private String password;
        @NotBlank(message = "请输入验证码")
        private String captcha;
        @NotBlank(message = "验证码参数缺失")
        private String captchaId;
    }

    @Data
    public static class LoginResult {
        private String token;
        private Long id;
        private String username;
        private String realName;
        private Integer isSuper;
        private Long roleId;
        private String roleName;
        private List<Map<String, Object>> menus;
        private Set<String> perms;
    }

    @Data
    public static class AdminSaveRequest {
        /** 为空=新增，非空=编辑 */
        private Long id;
        @NotBlank(message = "账号不能为空")
        private String username;
        private String realName;
        private Long roleId;
        /** 1=启用 0=禁用，新增默认启用 */
        private Integer status;
        /** 新增时必填；编辑时留空表示不改密码 */
        private String password;
    }

    @Data
    public static class PasswordRequest {
        @NotBlank(message = "密码不能为空")
        private String password;
    }

    @Data
    public static class StatusRequest {
        private Integer status;
    }
}

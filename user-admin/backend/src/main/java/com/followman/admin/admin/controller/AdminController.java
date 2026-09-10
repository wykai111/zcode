package com.followman.admin.admin.controller;

import com.followman.admin.admin.dto.AuthDtos.AdminSaveRequest;
import com.followman.admin.admin.dto.AuthDtos.PasswordRequest;
import com.followman.admin.admin.dto.AuthDtos.StatusRequest;
import com.followman.admin.admin.entity.SysRole;
import com.followman.admin.admin.mapper.SysRoleMapper;
import com.followman.admin.admin.service.AdminService;
import com.followman.admin.admin.service.MenuService;
import com.followman.admin.auth.AdminContext;
import com.followman.admin.auth.RequirePerm;
import com.followman.admin.common.PageResult;
import com.followman.admin.common.Result;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/** 后台管理员账号管理（超级管理员） */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;
    private final MenuService menuService;
    private final SysRoleMapper roleMapper;

    /** 管理员列表 */
    @GetMapping("/users")
    @RequirePerm("admin:user:view")
    public Result<PageResult<Map<String, Object>>> users(
            @RequestParam(defaultValue = "1") long index,
            @RequestParam(defaultValue = "10") long size,
            @RequestParam(required = false) String username,
            @RequestParam(required = false) String realName,
            @RequestParam(required = false) Integer status) {
        return Result.ok(adminService.page(index, size, username, realName, status));
    }

    /** 新增管理员 */
    @PostMapping("/users")
    @RequirePerm("admin:user:save")
    public Result<Void> create(@Valid @RequestBody AdminSaveRequest req) {
        adminService.create(req);
        return Result.ok();
    }

    /** 编辑管理员 */
    @PutMapping("/users")
    @RequirePerm("admin:user:save")
    public Result<Void> update(@Valid @RequestBody AdminSaveRequest req) {
        adminService.update(req);
        return Result.ok();
    }

    /** 重置密码 */
    @PutMapping("/users/{id}/password")
    @RequirePerm("admin:user:pwd")
    public Result<Void> resetPassword(@PathVariable Long id, @Valid @RequestBody PasswordRequest req) {
        adminService.resetPassword(id, req.getPassword());
        return Result.ok();
    }

    /** 启用/禁用 */
    @PutMapping("/users/{id}/status")
    @RequirePerm("admin:user:status")
    public Result<Void> status(@PathVariable Long id, @RequestBody StatusRequest req) {
        adminService.updateStatus(id, req.getStatus());
        return Result.ok();
    }

    /** 角色下拉列表 */
    @GetMapping("/roles")
    @RequirePerm("admin:user:view")
    public Result<List<SysRole>> roles() {
        return Result.ok(menuService.roles());
    }

    /** 当前管理员的菜单树（前端动态菜单） */
    @GetMapping("/menus")
    public Result<List<Map<String, Object>>> menus() {
        AdminContext.Current current = AdminContext.get();
        Set<Long> allowed = null;
        if (!current.isSuperAdmin()) {
            SysRole role = roleMapper.selectById(current.getRoleId());
            allowed = new HashSet<>();
            if (role != null && role.getMenuIds() != null) {
                for (String s : role.getMenuIds().split(",")) {
                    if (!s.isBlank()) {
                        allowed.add(Long.valueOf(s.trim()));
                    }
                }
            }
        }
        return Result.ok(menuService.menuTree(allowed));
    }
}

package com.followman.admin.admin.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.followman.admin.admin.dto.AuthDtos.AdminSaveRequest;
import com.followman.admin.admin.entity.SysAdmin;
import com.followman.admin.admin.entity.SysRole;
import com.followman.admin.admin.mapper.SysAdminMapper;
import com.followman.admin.admin.mapper.SysRoleMapper;
import com.followman.admin.auth.AdminContext;
import com.followman.admin.common.BizException;
import com.followman.admin.common.OperateLogService;
import com.followman.admin.common.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

/** 后台管理员账号管理（仅超级管理员可操作） */
@Service
@RequiredArgsConstructor
public class AdminService {

    private final SysAdminMapper adminMapper;
    private final SysRoleMapper roleMapper;
    private final BCryptPasswordEncoder encoder;
    private final OperateLogService operateLogService;

    /** 管理员列表（分页 + 筛选），含角色名称 */
    public PageResult<Map<String, Object>> page(long index, long size, String username, String realName, Integer status) {
        LambdaQueryWrapper<SysAdmin> qw = new LambdaQueryWrapper<SysAdmin>()
                .like(username != null && !username.isBlank(), SysAdmin::getUsername, username)
                .like(realName != null && !realName.isBlank(), SysAdmin::getRealName, realName)
                .eq(status != null, SysAdmin::getStatus, status)
                .orderByAsc(SysAdmin::getId);
        Page<SysAdmin> p = adminMapper.selectPage(new Page<>(index, size), qw);

        Map<Long, String> roleNames = new HashMap<>();
        for (SysRole role : roleMapper.selectList(null)) {
            roleNames.put(role.getId(), role.getName());
        }

        java.util.List<Map<String, Object>> list = p.getRecords().stream().map(a -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", a.getId());
            m.put("username", a.getUsername());
            m.put("realName", a.getRealName());
            m.put("roleId", a.getRoleId());
            m.put("roleName", a.getIsSuper() != null && a.getIsSuper() == 1
                    ? "超级管理员" : roleNames.get(a.getRoleId()));
            m.put("isSuper", a.getIsSuper());
            m.put("status", a.getStatus());
            m.put("lastLoginTime", a.getLastLoginTime());
            m.put("lastLoginIp", a.getLastLoginIp());
            m.put("createdAt", a.getCreatedAt());
            return m;
        }).collect(java.util.stream.Collectors.toList());

        return new PageResult<>(p.getTotal(), p.getSize(), p.getCurrent(), list);
    }

    /** 新增管理员 */
    public void create(AdminSaveRequest req) {
        if (req.getPassword() == null || req.getPassword().isBlank()) {
            throw new BizException("新增管理员必须设置密码");
        }
        checkUsernameUnique(req.getUsername(), null);
        SysAdmin admin = new SysAdmin();
        admin.setUsername(req.getUsername().trim());
        admin.setPassword(encoder.encode(req.getPassword()));
        admin.setRealName(req.getRealName());
        admin.setRoleId(req.getRoleId());
        admin.setIsSuper(0);
        admin.setStatus(req.getStatus() == null ? 1 : req.getStatus());
        admin.setFailCount(0);
        adminMapper.insert(admin);
        operateLogService.save("管理员", "新增", "新增管理员：" + admin.getUsername(),
                null, "roleId=" + req.getRoleId() + ", status=" + admin.getStatus());
    }

    /** 编辑管理员：姓名、角色、启用/禁用 */
    public void update(AdminSaveRequest req) {
        if (req.getId() == null) {
            throw new BizException("缺少管理员ID");
        }
        SysAdmin admin = adminMapper.selectById(req.getId());
        if (admin == null) {
            throw new BizException("管理员不存在");
        }
        String before = "realName=" + admin.getRealName() + ", roleId=" + admin.getRoleId()
                + ", status=" + admin.getStatus();

        if (!admin.getUsername().equals(req.getUsername().trim())) {
            checkUsernameUnique(req.getUsername(), admin.getId());
            admin.setUsername(req.getUsername().trim());
        }
        admin.setRealName(req.getRealName());
        admin.setRoleId(req.getRoleId());
        if (req.getStatus() != null) {
            if (req.getId().equals(AdminContext.get().getId()) && req.getStatus() == 0) {
                throw new BizException("不能禁用自己");
            }
            admin.setStatus(req.getStatus());
        }
        adminMapper.updateById(admin);
        operateLogService.save("管理员", "编辑", "编辑管理员：" + admin.getUsername(),
                before, "realName=" + admin.getRealName() + ", roleId=" + admin.getRoleId()
                        + ", status=" + admin.getStatus());
    }

    /** 重置密码 */
    public void resetPassword(Long id, String password) {
        SysAdmin admin = adminMapper.selectById(id);
        if (admin == null) {
            throw new BizException("管理员不存在");
        }
        admin.setPassword(encoder.encode(password));
        admin.setFailCount(0);
        admin.setLockUntil(null);
        adminMapper.updateById(admin);
        operateLogService.save("管理员", "重置密码", "重置密码：" + admin.getUsername(), null, null);
    }

    /** 启用/禁用 */
    public void updateStatus(Long id, Integer status) {
        if (id.equals(AdminContext.get().getId()) && status != null && status == 0) {
            throw new BizException("不能禁用自己");
        }
        SysAdmin admin = adminMapper.selectById(id);
        if (admin == null) {
            throw new BizException("管理员不存在");
        }
        if (admin.getIsSuper() != null && admin.getIsSuper() == 1
                && status != null && status == 0) {
            throw new BizException("不能禁用超级管理员");
        }
        admin.setStatus(status);
        adminMapper.updateById(admin);
        operateLogService.save("管理员", status == 1 ? "启用" : "禁用",
                (status == 1 ? "启用" : "禁用") + "管理员：" + admin.getUsername(), null, null);
    }

    private void checkUsernameUnique(String username, Long excludeId) {
        LambdaQueryWrapper<SysAdmin> qw = new LambdaQueryWrapper<SysAdmin>()
                .eq(SysAdmin::getUsername, username.trim())
                .ne(excludeId != null, SysAdmin::getId, excludeId);
        if (adminMapper.selectCount(qw) > 0) {
            throw new BizException("账号已存在");
        }
    }
}

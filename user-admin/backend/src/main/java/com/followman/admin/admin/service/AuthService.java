package com.followman.admin.admin.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.followman.admin.admin.dto.AuthDtos.LoginRequest;
import com.followman.admin.admin.dto.AuthDtos.LoginResult;
import com.followman.admin.admin.entity.SysAdmin;
import com.followman.admin.admin.entity.SysLoginLog;
import com.followman.admin.admin.entity.SysRole;
import com.followman.admin.admin.mapper.SysAdminMapper;
import com.followman.admin.admin.mapper.SysLoginLogMapper;
import com.followman.admin.admin.mapper.SysRoleMapper;
import com.followman.admin.auth.JwtUtil;
import com.followman.admin.captcha.CaptchaService;
import com.followman.admin.common.BizException;
import com.followman.admin.common.IpUtil;
import com.followman.admin.config.AppProperties;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Set;

/** 管理员认证：验证码、登录、锁定、登录日志、token */
@Service
@RequiredArgsConstructor
public class AuthService {

    private final SysAdminMapper adminMapper;
    private final SysRoleMapper roleMapper;
    private final SysLoginLogMapper loginLogMapper;
    private final MenuService menuService;
    private final CaptchaService captchaService;
    private final JwtUtil jwtUtil;
    private final BCryptPasswordEncoder encoder;
    private final AppProperties props;

    public Map<String, String> captcha() {
        return captchaService.generate();
    }

    public LoginResult login(LoginRequest req, HttpServletRequest request) {
        String ip = IpUtil.get(request);
        // 1. 验证码
        captchaService.verify(req.getCaptchaId(), req.getCaptcha());

        // 2. 账号
        SysAdmin admin = adminMapper.selectOne(new LambdaQueryWrapper<SysAdmin>()
                .eq(SysAdmin::getUsername, req.getUsername()));
        if (admin == null) {
            failLog(null, req.getUsername(), ip, "账号不存在");
            throw new BizException("账号不存在");
        }
        // 3. 状态
        if (admin.getStatus() == null || admin.getStatus() != 1) {
            failLog(admin.getId(), req.getUsername(), ip, "账号已禁用");
            throw new BizException("账号已禁用，请联系管理员");
        }
        // 4. 锁定
        if (admin.getLockUntil() != null && admin.getLockUntil().isAfter(LocalDateTime.now())) {
            long mins = Duration.between(LocalDateTime.now(), admin.getLockUntil()).toMinutes() + 1;
            failLog(admin.getId(), req.getUsername(), ip, "账号锁定中");
            throw new BizException("密码错误次数过多，账号已锁定，请 " + mins + " 分钟后重试");
        }
        // 5. 密码
        if (!encoder.matches(req.getPassword(), admin.getPassword())) {
            int failCount = (admin.getFailCount() == null ? 0 : admin.getFailCount()) + 1;
            String reason = "密码错误";
            if (failCount >= props.getAuth().getMaxFailCount()) {
                admin.setFailCount(0);
                admin.setLockUntil(LocalDateTime.now().plusMinutes(props.getAuth().getLockMinutes()));
                reason = "连续失败" + props.getAuth().getMaxFailCount() + "次，锁定"
                        + props.getAuth().getLockMinutes() + "分钟";
            } else {
                admin.setFailCount(failCount);
            }
            adminMapper.updateById(admin);
            failLog(admin.getId(), req.getUsername(), ip, reason);
            int remain = props.getAuth().getMaxFailCount() - failCount;
            throw new BizException("密码错误"
                    + (remain > 0 ? "，还可尝试 " + remain + " 次" : "，账号已锁定"));
        }

        // 6. 登录成功
        admin.setFailCount(0);
        admin.setLockUntil(null);
        admin.setLastLoginTime(LocalDateTime.now());
        admin.setLastLoginIp(ip);
        adminMapper.updateById(admin);
        successLog(admin.getId(), req.getUsername(), ip);

        LoginResult result = buildLoginResult(admin);
        result.setToken(jwtUtil.generate(admin.getId(), admin.getUsername()));
        return result;
    }

    public LoginResult me(Long adminId) {
        SysAdmin admin = adminMapper.selectById(adminId);
        if (admin == null) {
            throw new BizException(401, "登录已失效，请重新登录");
        }
        return buildLoginResult(admin);
    }

    private LoginResult buildLoginResult(SysAdmin admin) {
        LoginResult result = new LoginResult();
        result.setId(admin.getId());
        result.setUsername(admin.getUsername());
        result.setRealName(admin.getRealName());
        result.setIsSuper(admin.getIsSuper());
        result.setRoleId(admin.getRoleId());

        Set<Long> menuIds = null;
        if (admin.getIsSuper() == null || admin.getIsSuper() != 1) {
            SysRole role = admin.getRoleId() == null ? null : roleMapper.selectById(admin.getRoleId());
            if (role != null) {
                result.setRoleName(role.getName());
                menuIds = parseMenuIds(role.getMenuIds());
            }
            result.setPerms(menuService.permsOfRole(admin.getRoleId()));
        } else {
            result.setRoleName("超级管理员");
            result.setPerms(Set.of());
        }
        result.setMenus(menuService.menuTree(menuIds));
        return result;
    }

    private Set<Long> parseMenuIds(String menuIds) {
        if (menuIds == null || menuIds.isBlank()) {
            return Set.of();
        }
        Set<Long> ids = new java.util.HashSet<>();
        for (String s : menuIds.split(",")) {
            String t = s.trim();
            if (!t.isEmpty()) {
                ids.add(Long.valueOf(t));
            }
        }
        return ids;
    }

    private void failLog(Long adminId, String username, String ip, String reason) {
        SysLoginLog log = new SysLoginLog();
        log.setAdminId(adminId);
        log.setUsername(username);
        log.setIp(ip);
        log.setResult(0);
        log.setReason(reason);
        log.setCreatedAt(LocalDateTime.now());
        loginLogMapper.insert(log);
    }

    private void successLog(Long adminId, String username, String ip) {
        SysLoginLog log = new SysLoginLog();
        log.setAdminId(adminId);
        log.setUsername(username);
        log.setIp(ip);
        log.setResult(1);
        log.setReason("登录成功");
        log.setCreatedAt(LocalDateTime.now());
        loginLogMapper.insert(log);
    }
}

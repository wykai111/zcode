package com.followman.admin.auth;

import com.followman.admin.admin.entity.SysAdmin;
import com.followman.admin.admin.mapper.SysAdminMapper;
import com.followman.admin.admin.service.MenuService;
import com.followman.admin.common.BizException;
import com.followman.admin.config.AppProperties;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;

import java.time.LocalDateTime;
import java.util.Set;

/** 认证拦截器：校验 token、注入上下文、接口权限校验、滑动续期 */
@Component
@RequiredArgsConstructor
public class AuthInterceptor implements HandlerInterceptor {

    private final JwtUtil jwtUtil;
    private final SysAdminMapper adminMapper;
    private final MenuService menuService;
    private final AppProperties props;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }
        String auth = request.getHeader("Authorization");
        if (auth == null || !auth.startsWith("Bearer ")) {
            throw new BizException(401, "未登录");
        }
        String token = auth.substring(7);
        Long adminId = jwtUtil.parse(token);

        SysAdmin admin = adminMapper.selectById(adminId);
        if (admin == null || admin.getStatus() == null || admin.getStatus() != 1) {
            throw new BizException(401, "账号已被禁用或不存在");
        }

        // 组装当前管理员上下文
        Set<String> perms = admin.getIsSuper() != null && admin.getIsSuper() == 1
                ? Set.of() : menuService.permsOfRole(admin.getRoleId());
        AdminContext.set(new AdminContext.Current(
                admin.getId(), admin.getUsername(), admin.getRealName(), admin.getRoleId(),
                admin.getIsSuper() != null && admin.getIsSuper() == 1, perms));

        // 接口权限校验
        if (handler instanceof HandlerMethod hm) {
            RequirePerm rp = hm.getMethodAnnotation(RequirePerm.class);
            if (rp != null && !AdminContext.get().hasPerm(rp.value())) {
                throw new BizException(403, "无权限执行该操作");
            }
        }

        // 滑动续期：剩余时间不足时签发新 token 放到响应头
        long remaining = jwtUtil.remainingMs(token);
        if (remaining > 0 && remaining < props.getJwt().getRenewThresholdMinutes() * 60_000L) {
            response.setHeader("X-New-Token", jwtUtil.generate(admin.getId(), admin.getUsername()));
        }
        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) {
        AdminContext.clear();
    }
}

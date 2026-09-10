package com.followman.admin;

import com.followman.admin.admin.entity.SysAdmin;
import com.followman.admin.admin.mapper.SysAdminMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

/** 首次启动初始化：创建超级管理员 admin / admin123 */
@Slf4j
@Component
@RequiredArgsConstructor
public class InitDataRunner implements ApplicationRunner {

    private final SysAdminMapper adminMapper;
    private final BCryptPasswordEncoder encoder;

    @Override
    public void run(ApplicationArguments args) {
        if (adminMapper.selectCount(null) > 0) {
            return;
        }
        SysAdmin admin = new SysAdmin();
        admin.setUsername("admin");
        admin.setPassword(encoder.encode("admin123"));
        admin.setRealName("超级管理员");
        admin.setRoleId(1L);
        admin.setIsSuper(1);
        admin.setStatus(1);
        admin.setFailCount(0);
        adminMapper.insert(admin);
        log.info("已创建初始超级管理员：admin / admin123（请尽快修改密码）");
    }
}

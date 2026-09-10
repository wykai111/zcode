package com.followman.admin.common;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.followman.admin.auth.AdminContext;
import com.followman.admin.common.mapper.SysOperateLogMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

/** 操作日志服务：所有后台写操作统一留痕（只增不删） */
@Service
@RequiredArgsConstructor
public class OperateLogService {

    private final SysOperateLogMapper logMapper;

    /** 记录操作日志 */
    public void save(String module, String action, String content, String beforeData, String afterData) {
        SysOperateLog log = new SysOperateLog();
        AdminContext.Current admin = AdminContext.get();
        if (admin != null) {
            log.setAdminId(admin.getId());
            log.setAdminName(admin.getUsername());
        }
        log.setModule(module);
        log.setAction(action);
        log.setContent(content);
        log.setBeforeData(beforeData);
        log.setAfterData(afterData);
        log.setCreatedAt(LocalDateTime.now());
        logMapper.insert(log);
    }

    public void save(String module, String action, String content) {
        save(module, action, content, null, null);
    }

    /** 分页查询 */
    public PageResult<SysOperateLog> page(long index, long size, String adminName, String module,
                                          String action, String beginTime, String endTime) {
        LambdaQueryWrapper<SysOperateLog> qw = new LambdaQueryWrapper<>();
        qw.like(adminName != null && !adminName.isBlank(), SysOperateLog::getAdminName, adminName)
          .eq(module != null && !module.isBlank(), SysOperateLog::getModule, module)
          .eq(action != null && !action.isBlank(), SysOperateLog::getAction, action)
          .ge(beginTime != null && !beginTime.isBlank(), SysOperateLog::getCreatedAt, beginTime)
          .le(endTime != null && !endTime.isBlank(), SysOperateLog::getCreatedAt, endTime)
          .orderByDesc(SysOperateLog::getId);
        Page<SysOperateLog> p = logMapper.selectPage(new Page<>(index, size), qw);
        return new PageResult<>(p.getTotal(), p.getSize(), p.getCurrent(), p.getRecords());
    }
}

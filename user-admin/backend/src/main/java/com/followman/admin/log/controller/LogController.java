package com.followman.admin.log.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.followman.admin.admin.entity.SysLoginLog;
import com.followman.admin.admin.mapper.SysLoginLogMapper;
import com.followman.admin.auth.RequirePerm;
import com.followman.admin.common.OperateLogService;
import com.followman.admin.common.PageResult;
import com.followman.admin.common.Result;
import com.followman.admin.common.SysOperateLog;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** 日志查询接口（只读） */
@RestController
@RequestMapping("/api/log")
@RequiredArgsConstructor
public class LogController {

    private final OperateLogService operateLogService;
    private final SysLoginLogMapper loginLogMapper;

    /** 操作日志列表 */
    @GetMapping("/operate/list")
    @RequirePerm("log:view")
    public Result<PageResult<SysOperateLog>> operateList(
            @RequestParam(defaultValue = "1") long index,
            @RequestParam(defaultValue = "10") long size,
            @RequestParam(required = false) String adminName,
            @RequestParam(required = false) String module,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String beginTime,
            @RequestParam(required = false) String endTime) {
        return Result.ok(operateLogService.page(index, size, adminName, module, action, beginTime, endTime));
    }

    /** 登录日志列表 */
    @GetMapping("/login/list")
    @RequirePerm("log:view")
    public Result<PageResult<SysLoginLog>> loginList(
            @RequestParam(defaultValue = "1") long index,
            @RequestParam(defaultValue = "10") long size,
            @RequestParam(required = false) String username,
            @RequestParam(required = false) Integer result,
            @RequestParam(required = false) String beginTime,
            @RequestParam(required = false) String endTime) {
        Page<SysLoginLog> p = loginLogMapper.selectPage(new Page<>(index, size),
                new LambdaQueryWrapper<SysLoginLog>()
                        .like(username != null && !username.isBlank(), SysLoginLog::getUsername, username)
                        .eq(result != null, SysLoginLog::getResult, result)
                        .ge(beginTime != null && !beginTime.isBlank(), SysLoginLog::getCreatedAt, beginTime)
                        .le(endTime != null && !endTime.isBlank(), SysLoginLog::getCreatedAt, endTime)
                        .orderByDesc(SysLoginLog::getId));
        return Result.ok(new PageResult<>(p.getTotal(), p.getSize(), p.getCurrent(), p.getRecords()));
    }
}

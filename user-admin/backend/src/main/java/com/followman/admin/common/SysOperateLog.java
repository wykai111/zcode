package com.followman.admin.common;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/** 后台操作日志（只增不删） */
@Data
@TableName("sys_operate_log")
public class SysOperateLog {

    @TableId(type = IdType.AUTO)
    private Long id;
    private Long adminId;
    private String adminName;
    private String module;
    private String action;
    private String content;
    private String beforeData;
    private String afterData;
    private String ip;
    private LocalDateTime createdAt;
}

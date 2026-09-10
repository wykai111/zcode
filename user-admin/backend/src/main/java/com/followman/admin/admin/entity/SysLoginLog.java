package com.followman.admin.admin.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("sys_login_log")
public class SysLoginLog {

    @TableId(type = IdType.AUTO)
    private Long id;
    private Long adminId;
    private String username;
    private String ip;
    /** 1=成功 0=失败 */
    private Integer result;
    private String reason;
    private LocalDateTime createdAt;
}

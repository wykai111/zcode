package com.followman.admin.admin.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("sys_admin")
public class SysAdmin {

    @TableId(type = IdType.AUTO)
    private Long id;
    private String username;
    private String password;
    private String realName;
    private Long roleId;
    /** 1=超级管理员 0=普通 */
    private Integer isSuper;
    /** 1=启用 0=禁用 */
    private Integer status;
    private Integer failCount;
    private LocalDateTime lockUntil;
    private LocalDateTime lastLoginTime;
    private String lastLoginIp;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    /** 逻辑删除 1=已删除 */
    @TableLogic
    private Integer deleted;
}

package com.followman.admin.admin.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("sys_role")
public class SysRole {

    @TableId(type = IdType.AUTO)
    private Long id;
    private String code;
    private String name;
    /** 菜单ID集合，逗号分隔 */
    private String menuIds;
    /** 操作权限标识集合，逗号分隔 */
    private String perms;
    private String remark;
    private LocalDateTime createdAt;
}

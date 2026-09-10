package com.followman.admin.admin.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("sys_menu")
public class SysMenu {

    @TableId(type = IdType.INPUT)
    private Long id;
    private Long parentId;
    private String name;
    private String path;
    private String component;
    private String icon;
    private Integer sort;
    /** 1=目录 2=菜单 */
    private Integer type;
    /** 接口权限标识 */
    private String perm;
    private Integer status;
    private LocalDateTime createdAt;
}

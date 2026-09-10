package com.followman.admin.cuser.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/** C 端业务用户（APP 前台注册） */
@Data
@TableName("c_user")
public class CUser {

    @TableId(type = IdType.AUTO)
    private Long id;
    private String phone;
    private String wxOpenid;
    private String qqOpenid;
    private String nickname;
    private String avatar;
    /** 1=正常 2=冻结 3=注销 */
    private Integer status;
    private LocalDateTime registerTime;
    private LocalDateTime lastLoginTime;
    /** 1=手机号 2=微信 3=QQ */
    private Integer lastLoginSource;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

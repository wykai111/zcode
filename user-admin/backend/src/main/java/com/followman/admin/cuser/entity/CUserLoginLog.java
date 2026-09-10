package com.followman.admin.cuser.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("c_user_login_log")
public class CUserLoginLog {

    @TableId(type = IdType.AUTO)
    private Long id;
    private Long userId;
    /** 1=手机号 2=微信 3=QQ */
    private Integer source;
    private String ip;
    private LocalDateTime loginTime;
}

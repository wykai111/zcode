package com.followman.admin.cuser.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/** 用户注销申请 */
@Data
@TableName("c_user_cancel")
public class CUserCancel {

    @TableId(type = IdType.AUTO)
    private Long id;
    private Long userId;
    private LocalDateTime applyTime;
    private LocalDateTime coolingEndTime;
    /** 1=冷却中 2=已完成 3=已撤销 */
    private Integer status;
    private LocalDateTime cancelTime;
    private LocalDateTime createdAt;
}

package com.followman.admin.stock.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/** 码表变更日志 */
@Data
@TableName("stock_change_log")
public class StockChangeLog {

    @TableId(type = IdType.AUTO)
    private Long id;
    private Long adminId;
    private String adminName;
    private String action;
    private String stockCode;
    private String beforeData;
    private String afterData;
    private String remark;
    private LocalDateTime createdAt;
}

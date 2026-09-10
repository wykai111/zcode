package com.followman.admin.stock.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/** 股票码表 */
@Data
@TableName("stock_code")
public class StockCode {

    @TableId(type = IdType.AUTO)
    private Long id;
    /** 码表代码，如 sz000001 */
    private String code;
    /** 交易代码，如 000001 */
    private String exchangeCode;
    private String name;
    /** SH/SZ/BJ/HK/US */
    private String market;
    private String industry;
    /** 1=股票 2=期货 3=期权 4=基金 */
    private Integer category;
    /** 1=正常 2=停牌 3=退市 */
    private Integer status;
    private String remark;
    private Long createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

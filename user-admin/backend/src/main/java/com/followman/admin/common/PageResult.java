package com.followman.admin.common;

import lombok.Data;

/** 分页响应结构 */
@Data
public class PageResult<T> {

    private long total;
    private long pageSize;
    private long index;
    private java.util.List<T> list;

    public PageResult(long total, long pageSize, long index, java.util.List<T> list) {
        this.total = total;
        this.pageSize = pageSize;
        this.index = index;
        this.list = list;
    }
}

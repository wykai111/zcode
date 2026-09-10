package com.followman.admin.stock.controller;

import com.alibaba.excel.EasyExcel;
import com.alibaba.excel.annotation.ExcelProperty;
import com.alibaba.excel.write.style.column.LongestMatchColumnWidthStyleStrategy;
import com.followman.admin.auth.RequirePerm;
import com.followman.admin.common.BizException;
import com.followman.admin.common.PageResult;
import com.followman.admin.common.Result;
import com.followman.admin.stock.entity.StockChangeLog;
import com.followman.admin.stock.entity.StockCode;
import com.followman.admin.stock.service.StockService;
import jakarta.servlet.http.HttpServletResponse;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/** 股票码表管理接口 */
@RestController
@RequestMapping("/api/stock")
@RequiredArgsConstructor
public class StockController {

    private final StockService stockService;

    /** 码表列表 */
    @GetMapping("/list")
    @RequirePerm("stock:view")
    public Result<PageResult<StockCode>> list(
            @RequestParam(defaultValue = "1") long index,
            @RequestParam(defaultValue = "10") long size,
            @RequestParam(required = false) String code,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String market,
            @RequestParam(required = false) Integer status) {
        return Result.ok(stockService.page(index, size, code, name, market, status));
    }

    /** 新增 */
    @PostMapping("")
    @RequirePerm("stock:save")
    public Result<Void> create(@RequestBody StockCode req) {
        stockService.create(req);
        return Result.ok();
    }

    /** 编辑 */
    @PutMapping("")
    @RequirePerm("stock:save")
    public Result<Void> update(@RequestBody StockCode req) {
        stockService.update(req);
        return Result.ok();
    }

    /** 启用/禁用 */
    @PutMapping("/{id}/status")
    @RequirePerm("stock:status")
    public Result<Void> status(@PathVariable Long id, @RequestBody StatusBody body) {
        stockService.updateStatus(id, body.getStatus());
        return Result.ok();
    }

    /** Excel 批量导入 */
    @PostMapping("/import")
    @RequirePerm("stock:import")
    public Result<StockService.ImportResult> importExcel(@RequestParam("file") MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new BizException("请上传 Excel 文件");
        }
        List<StockRow> excelRows = EasyExcel.read(file.getInputStream(), StockRow.class, null)
                .sheet(0)
                .doReadSync();
        List<StockCode> rows = excelRows.stream()
                .map(r -> {
                    StockCode s = new StockCode();
                    s.setCode(r.getCode());
                    s.setExchangeCode(r.getExchangeCode());
                    s.setName(r.getName());
                    s.setMarket(r.getMarket());
                    s.setIndustry(r.getIndustry());
                    s.setCategory(r.getCategory());
                    s.setStatus(r.getStatus());
                    s.setRemark(r.getRemark());
                    return s;
                })
                .collect(Collectors.toList());
        if (rows.isEmpty()) {
            throw new BizException("Excel 中没有数据行");
        }
        return Result.ok(stockService.importRows(rows));
    }

    /** 导出全部/筛选结果 Excel */
    @GetMapping("/export")
    @RequirePerm("stock:export")
    public void export(@RequestParam(required = false) String code,
                       @RequestParam(required = false) String name,
                       @RequestParam(required = false) String market,
                       @RequestParam(required = false) Integer status,
                       HttpServletResponse response) throws IOException {
        List<StockCode> list = stockService.exportList(code, name, market, status);
        List<StockRow> rows = list.stream().map(s -> {
            StockRow r = new StockRow();
            r.setCode(s.getCode());
            r.setExchangeCode(s.getExchangeCode());
            r.setName(s.getName());
            r.setMarket(s.getMarket());
            r.setIndustry(s.getIndustry());
            r.setCategory(s.getCategory());
            r.setStatus(s.getStatus());
            r.setRemark(s.getRemark());
            return r;
        }).collect(Collectors.toList());

        response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        response.setCharacterEncoding("utf-8");
        String fileName = URLEncoder.encode("股票码表", StandardCharsets.UTF_8).replace("+", "%20");
        response.setHeader("Content-Disposition", "attachment;filename*=utf-8''" + fileName + ".xlsx");
        EasyExcel.write(response.getOutputStream(), StockRow.class)
                .registerWriteHandler(new LongestMatchColumnWidthStyleStrategy())
                .sheet("码表")
                .doWrite(rows);
    }

    /** 导入模板下载 */
    @GetMapping("/template")
    @RequirePerm("stock:import")
    public void template(HttpServletResponse response) throws IOException {
        response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        response.setCharacterEncoding("utf-8");
        String fileName = URLEncoder.encode("码表导入模板", StandardCharsets.UTF_8).replace("+", "%20");
        response.setHeader("Content-Disposition", "attachment;filename*=utf-8''" + fileName + ".xlsx");
        EasyExcel.write(response.getOutputStream(), StockRow.class)
                .registerWriteHandler(new LongestMatchColumnWidthStyleStrategy())
                .sheet("码表")
                .doWrite(List.of(exampleRow()));
    }

    /** 从行情 API 同步 */
    @PostMapping("/sync")
    @RequirePerm("stock:sync")
    public Result<Map<String, Object>> sync() {
        return Result.ok(stockService.sync());
    }

    /** 码表变更日志 */
    @GetMapping("/log")
    @RequirePerm("stock:log:view")
    public Result<PageResult<StockChangeLog>> log(
            @RequestParam(defaultValue = "1") long index,
            @RequestParam(defaultValue = "10") long size,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String stockCode,
            @RequestParam(required = false) String beginTime,
            @RequestParam(required = false) String endTime) {
        return Result.ok(stockService.changeLogPage(index, size, action, stockCode, beginTime, endTime));
    }

    private StockRow exampleRow() {
        StockRow r = new StockRow();
        r.setCode("sh600000");
        r.setExchangeCode("600000");
        r.setName("浦发银行");
        r.setMarket("SH");
        r.setIndustry("银行");
        r.setCategory(1);
        r.setStatus(1);
        r.setRemark("示例行，导入前请删除");
        return r;
    }

    @Data
    public static class StatusBody { private Integer status; }

    /** 导入导出行模型（与 Excel 列对应） */
    @Data
    public static class StockRow {
        @ExcelProperty("股票代码")
        private String code;
        @ExcelProperty("交易代码")
        private String exchangeCode;
        @ExcelProperty("股票名称")
        private String name;
        @ExcelProperty("市场(SH/SZ/BJ/HK/US)")
        private String market;
        @ExcelProperty("行业")
        private String industry;
        @ExcelProperty("类别(1股票2期货3期权4基金)")
        private Integer category;
        @ExcelProperty("状态(1正常2停牌3退市)")
        private Integer status;
        @ExcelProperty("备注")
        private String remark;
    }
}

package com.followman.admin.stock.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.followman.admin.auth.AdminContext;
import com.followman.admin.common.BizException;
import com.followman.admin.common.OperateLogService;
import com.followman.admin.common.PageResult;
import com.followman.admin.config.AppProperties;
import com.followman.admin.stock.entity.StockChangeLog;
import com.followman.admin.stock.entity.StockCode;
import com.followman.admin.stock.mapper.StockChangeLogMapper;
import com.followman.admin.stock.mapper.StockCodeMapper;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/** 股票码表管理 */
@Slf4j
@Service
@RequiredArgsConstructor
public class StockService {

    private final StockCodeMapper stockMapper;
    private final StockChangeLogMapper changeLogMapper;
    private final OperateLogService operateLogService;
    private final AppProperties props;
    private final org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;
    /** 使用 Spring 自动配置的 ObjectMapper（已注册 JavaTimeModule） */
    private final ObjectMapper objectMapper;

    private static final Map<String, String> MARKET_BY_MARKET_ID = new HashMap<>();

    static {
        MARKET_BY_MARKET_ID.put("china_sh", "SH");
        MARKET_BY_MARKET_ID.put("china_sz", "SZ");
        MARKET_BY_MARKET_ID.put("china_bj", "BJ");
        MARKET_BY_MARKET_ID.put("us_nasdq", "US");
        MARKET_BY_MARKET_ID.put("hk_hkex", "HK");
    }

    /** 码表列表 */
    public PageResult<StockCode> page(long index, long size, String code, String name,
                                      String market, Integer status) {
        Page<StockCode> p = stockMapper.selectPage(new Page<>(index, size),
                new LambdaQueryWrapper<StockCode>()
                        .like(code != null && !code.isBlank(), StockCode::getCode, code)
                        .like(name != null && !name.isBlank(), StockCode::getName, name)
                        .eq(market != null && !market.isBlank(), StockCode::getMarket, market)
                        .eq(status != null, StockCode::getStatus, status)
                        .orderByAsc(StockCode::getMarket)
                        .orderByAsc(StockCode::getCode));
        return new PageResult<>(p.getTotal(), p.getSize(), p.getCurrent(), p.getRecords());
    }

    /** 新增单条 */
    public void create(StockCode req) {
        checkUnique(req.getCode(), req.getMarket(), null);
        req.setId(null);
        req.setCreatedBy(AdminContext.get().getId());
        req.setCreatedAt(LocalDateTime.now());
        stockMapper.insert(req);
        changeLog(req.getCode(), "新增", null, toJson(req), null);
        operateLogService.save("码表", "新增", "新增股票码表：" + req.getCode() + " " + req.getName(),
                null, toJson(req));
    }

    /** 编辑 */
    public void update(StockCode req) {
        if (req.getId() == null) {
            throw new BizException("缺少ID");
        }
        StockCode old = stockMapper.selectById(req.getId());
        if (old == null) {
            throw new BizException("记录不存在");
        }
        checkUnique(req.getCode(), req.getMarket(), req.getId());
        String before = toJson(old);
        // 显式 set，支持将字段清空为 null
        stockMapper.update(null, new com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper<StockCode>()
                .eq(StockCode::getId, req.getId())
                .set(StockCode::getCode, req.getCode())
                .set(StockCode::getExchangeCode, req.getExchangeCode())
                .set(StockCode::getName, req.getName())
                .set(StockCode::getMarket, req.getMarket())
                .set(StockCode::getIndustry, req.getIndustry())
                .set(StockCode::getCategory, req.getCategory())
                .set(StockCode::getRemark, req.getRemark()));
        StockCode after = stockMapper.selectById(req.getId());
        changeLog(after.getCode(), "编辑", before, toJson(after), null);
        operateLogService.save("码表", "编辑", "编辑股票码表：" + after.getCode() + " " + after.getName(),
                before, toJson(after));
    }

    /** 启用(1)/禁用(停牌2) */
    public void updateStatus(Long id, Integer status) {
        StockCode stock = stockMapper.selectById(id);
        if (stock == null) {
            throw new BizException("记录不存在");
        }
        String action = status != null && status == 1 ? "启用" : "禁用";
        String before = toJson(stock);
        stock.setStatus(status);
        stockMapper.updateById(stock);
        changeLog(stock.getCode(), action, before, toJson(stock), null);
        operateLogService.save("码表", action, action + "股票码表：" + stock.getCode(), before, toJson(stock));
    }

    /** 批量导入（Excel 行级校验，成功/失败明细返回） */
    public ImportResult importRows(List<StockCode> rows) {
        ImportResult result = new ImportResult();
        List<String> errors = new ArrayList<>();
        List<StockCode> toInsert = new ArrayList<>();
        List<StockCode> toUpdate = new ArrayList<>();
        int rowNo = 1;

        for (StockCode row : rows) {
            rowNo++;
            String label = "第" + rowNo + "行";
            if (isBlank(row.getCode()) || isBlank(row.getName()) || isBlank(row.getMarket())) {
                errors.add(label + "：股票代码/名称/市场不能为空");
                continue;
            }
            if (!row.getMarket().matches("SH|SZ|BJ|HK|US")) {
                errors.add(label + "：市场必须是 SH/SZ/BJ/HK/US 之一，实际为 " + row.getMarket());
                continue;
            }
            // 文件内重复
            boolean dupInFile = toInsert.stream().anyMatch(s -> s.getCode().equals(row.getCode()) && s.getMarket().equals(row.getMarket()))
                    || toUpdate.stream().anyMatch(s -> s.getCode().equals(row.getCode()) && s.getMarket().equals(row.getMarket()));
            if (dupInFile) {
                errors.add(label + "：文件内存在重复的 代码+市场 组合 " + row.getCode() + "+" + row.getMarket());
                continue;
            }
            StockCode exist = stockMapper.selectOne(new LambdaQueryWrapper<StockCode>()
                    .eq(StockCode::getCode, row.getCode())
                    .eq(StockCode::getMarket, row.getMarket()));
            if (exist == null) {
                toInsert.add(row);
            } else {
                row.setId(exist.getId());
                toUpdate.add(row);
            }
        }

        // 新增
        for (StockCode row : toInsert) {
            row.setCreatedBy(AdminContext.get().getId());
            row.setCreatedAt(LocalDateTime.now());
            stockMapper.insert(row);
            result.incInsert();
        }
        // 更新
        for (StockCode row : toUpdate) {
            StockCode old = stockMapper.selectById(row.getId());
            String before = toJson(old);
            stockMapper.update(null, new com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper<StockCode>()
                    .eq(StockCode::getId, row.getId())
                    .set(StockCode::getExchangeCode, row.getExchangeCode())
                    .set(StockCode::getName, row.getName())
                    .set(StockCode::getIndustry, row.getIndustry())
                    .set(StockCode::getCategory, row.getCategory() == null ? old.getCategory() : row.getCategory())
                    .set(StockCode::getStatus, row.getStatus() == null ? old.getStatus() : row.getStatus())
                    .set(StockCode::getRemark, row.getRemark()));
            changeLog(old.getCode(), "导入更新", before, toJson(stockMapper.selectById(row.getId())), null);
            result.incUpdate();
        }
        result.setErrors(errors);
        operateLogService.save("码表", "导入",
                "Excel批量导入码表：新增" + result.getInsertCount() + "条，更新" + result.getUpdateCount()
                        + "条，失败" + errors.size() + "条", null, null);
        return result;
    }

    /** 从行情 API 同步码表（批量处理） */
    public Map<String, Object> sync() {
        long start = System.currentTimeMillis();
        int insert = 0, update = 0, fail = 0;
        try {
            String base = props.getMarket().getBaseUrl();
            // 1. 市场列表（marketId -> marketCode 映射）
            Map<String, String> marketMap = new HashMap<>(MARKET_BY_MARKET_ID);
            try {
                JsonNode markets = postJson(base + "/api/market/list", "{}");
                JsonNode mdata = markets.path("data");
                if (mdata.isArray()) {
                    for (JsonNode m : mdata) {
                        marketMap.put(m.path("marketId").asText(), m.path("marketCode").asText());
                    }
                }
            } catch (Exception e) {
                log.warn("获取市场列表失败，使用内置映射: {}", e.getMessage());
            }
            // 2. 码表
            JsonNode resp = postJson(base + "/api/symbol/list", "{\"country\":\"CN\"}");
            int state = resp.path("message").path("state").asInt(-99);
            if (state != 0) {
                throw new BizException("行情API返回错误: " + resp.path("message").path("message").asText());
            }
            JsonNode data = resp.path("data");
            if (!data.isArray()) {
                throw new BizException("行情API无码表数据");
            }

            // 3. 现有码表一次性加载（code+market -> 记录）
            Map<String, StockCode> existing = new HashMap<>();
            for (StockCode e : stockMapper.selectList(null)) {
                existing.put(key(e.getCode(), e.getMarket()), e);
            }

            // 4. 内存比对：新增 / 变更 / 未变化
            List<StockCode> toInsert = new ArrayList<>();
            List<StockCode> toUpdate = new ArrayList<>();
            for (JsonNode item : data) {
                try {
                    String code = safeText(item, "code");
                    String market = marketMap.getOrDefault(safeText(item, "marketId"), marketOfCode(code));
                    if (code.isBlank() || market.isBlank()) {
                        fail++;
                        continue;
                    }
                    StockCode row = new StockCode();
                    row.setCode(code);
                    row.setExchangeCode(safeText(item, "exchangeCode"));
                    row.setName(safeText(item, "name"));
                    row.setMarket(market);
                    row.setIndustry(safeText(item, "industryId"));
                    row.setCategory(item.path("type").asInt(1));
                    row.setStatus(item.path("closeDate").isNull() ? 1 : 2);

                    StockCode exist = existing.get(key(code, market));
                    if (exist == null) {
                        row.setCreatedBy(AdminContext.get().getId());
                        row.setCreatedAt(LocalDateTime.now());
                        toInsert.add(row);
                    } else if (changed(exist, row)) {
                        toUpdate.add(row);
                    }
                } catch (Exception e) {
                    fail++;
                }
            }

            // 5. 批量写入（更新用显式 set，支持清空为 null）
            if (!toInsert.isEmpty()) {
                batchInsert(toInsert);
                insert = toInsert.size();
            }
            if (!toUpdate.isEmpty()) {
                for (StockCode row : toUpdate) {
                    stockMapper.update(null, new com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper<StockCode>()
                            .eq(StockCode::getCode, row.getCode())
                            .eq(StockCode::getMarket, row.getMarket())
                            .set(StockCode::getExchangeCode, row.getExchangeCode())
                            .set(StockCode::getName, row.getName())
                            .set(StockCode::getIndustry, row.getIndustry())
                            .set(StockCode::getCategory, row.getCategory())
                            .set(StockCode::getStatus, row.getStatus()));
                }
                update = toUpdate.size();
            }
        } catch (BizException e) {
            throw e;
        } catch (Exception e) {
            log.error("同步码表失败", e);
            throw new BizException("同步失败：" + e.getMessage());
        }
        long cost = System.currentTimeMillis() - start;
        Map<String, Object> summary = new HashMap<>();
        summary.put("insert", insert);
        summary.put("update", update);
        summary.put("fail", fail);
        summary.put("costMs", cost);
        changeLog(null, "同步", null, null, "新增" + insert + "/更新" + update + "/失败" + fail);
        operateLogService.save("码表", "同步", "从行情API同步码表：新增" + insert + "，更新" + update
                + "，失败" + fail + "，耗时" + cost + "ms", null, null);
        return summary;
    }

    /** 批量插入（每批 500 条） */
    private void batchInsert(List<StockCode> rows) {
        String sql = "INSERT INTO stock_code (code, exchange_code, name, market, industry, category, status, remark, created_by, created_at, updated_at) "
                + "VALUES (?,?,?,?,?,?,?,?,?,NOW(),NOW())";
        List<Object[]> args = rows.stream()
                .map(r -> new Object[]{r.getCode(), r.getExchangeCode(), r.getName(), r.getMarket(),
                        r.getIndustry(), r.getCategory(), r.getStatus(), r.getRemark(), r.getCreatedBy()})
                .collect(java.util.stream.Collectors.toList());
        jdbcTemplate.batchUpdate(sql, args);
    }

    private boolean changed(StockCode exist, StockCode row) {
        return !java.util.Objects.equals(exist.getExchangeCode(), row.getExchangeCode())
                || !java.util.Objects.equals(exist.getName(), row.getName())
                || !java.util.Objects.equals(exist.getIndustry(), row.getIndustry())
                || !java.util.Objects.equals(exist.getCategory(), row.getCategory())
                || !java.util.Objects.equals(exist.getStatus(), row.getStatus());
    }

    private String key(String code, String market) {
        return code + "|" + market;
    }

    /** JsonNode 安全取字符串：null 节点返回 null（避免 NullNode.asText() 返回 "null" 字符串） */
    private String safeText(JsonNode item, String field) {
        JsonNode node = item.path(field);
        return node.isNull() ? null : node.asText();
    }

    /** 码表变更日志分页 */
    public PageResult<StockChangeLog> changeLogPage(long index, long size, String action,
                                                    String stockCode, String beginTime, String endTime) {
        Page<StockChangeLog> p = changeLogMapper.selectPage(new Page<>(index, size),
                new LambdaQueryWrapper<StockChangeLog>()
                        .eq(action != null && !action.isBlank(), StockChangeLog::getAction, action)
                        .like(stockCode != null && !stockCode.isBlank(), StockChangeLog::getStockCode, stockCode)
                        .ge(beginTime != null && !beginTime.isBlank(), StockChangeLog::getCreatedAt, beginTime)
                        .le(endTime != null && !endTime.isBlank(), StockChangeLog::getCreatedAt, endTime)
                        .orderByDesc(StockChangeLog::getId));
        return new PageResult<>(p.getTotal(), p.getSize(), p.getCurrent(), p.getRecords());
    }

    public List<StockCode> exportList(String code, String name, String market, Integer status) {
        return stockMapper.selectList(new LambdaQueryWrapper<StockCode>()
                .like(code != null && !code.isBlank(), StockCode::getCode, code)
                .like(name != null && !name.isBlank(), StockCode::getName, name)
                .eq(market != null && !market.isBlank(), StockCode::getMarket, market)
                .eq(status != null, StockCode::getStatus, status)
                .orderByAsc(StockCode::getMarket).orderByAsc(StockCode::getCode));
    }

    // ---------- 私有工具 ----------

    private void checkUnique(String code, String market, Long excludeId) {
        if (isBlank(code) || isBlank(market)) {
            throw new BizException("股票代码和市场不能为空");
        }
        Long cnt = stockMapper.selectCount(new LambdaQueryWrapper<StockCode>()
                .eq(StockCode::getCode, code)
                .eq(StockCode::getMarket, market)
                .ne(excludeId != null, StockCode::getId, excludeId));
        if (cnt > 0) {
            throw new BizException("股票代码 + 市场 组合已存在，不能重复新增");
        }
    }

    private void changeLog(String stockCode, String action, String before, String after, String remark) {
        StockChangeLog log = new StockChangeLog();
        AdminContext.Current admin = AdminContext.get();
        if (admin != null) {
            log.setAdminId(admin.getId());
            log.setAdminName(admin.getUsername());
        }
        log.setAction(action);
        log.setStockCode(stockCode);
        log.setBeforeData(before);
        log.setAfterData(after);
        log.setRemark(remark);
        log.setCreatedAt(LocalDateTime.now());
        changeLogMapper.insert(log);
    }

    private String toJson(Object o) {
        try {
            return objectMapper.writeValueAsString(o);
        } catch (Exception e) {
            return String.valueOf(o);
        }
    }

    private boolean isBlank(String s) {
        return s == null || s.isBlank();
    }

    private String marketOfCode(String code) {
        if (code == null) return "";
        String lower = code.toLowerCase();
        if (lower.startsWith("sh")) return "SH";
        if (lower.startsWith("sz")) return "SZ";
        if (lower.startsWith("bj")) return "BJ";
        if (lower.startsWith("hk")) return "HK";
        return "US";
    }

    private JsonNode postJson(String url, String body) throws Exception {
        HttpClient client = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .timeout(Duration.ofSeconds(30))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(body))
                .build();
        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() != 200) {
            throw new BizException("行情API HTTP " + response.statusCode());
        }
        return objectMapper.readTree(response.body());
    }

    @Data
    public static class ImportResult {
        private int insertCount;
        private int updateCount;
        private List<String> errors = new ArrayList<>();

        public void incInsert() { insertCount++; }
        public void incUpdate() { updateCount++; }
    }
}

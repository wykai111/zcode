package com.followman.admin.cuser.controller;

import com.alibaba.excel.EasyExcel;
import com.alibaba.excel.write.style.column.LongestMatchColumnWidthStyleStrategy;
import com.followman.admin.auth.RequirePerm;
import com.followman.admin.common.PageResult;
import com.followman.admin.common.Result;
import com.followman.admin.cuser.entity.CUser;
import com.followman.admin.cuser.service.CUserService;
import jakarta.servlet.http.HttpServletResponse;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/** C 端用户管理接口 */
@RestController
@RequestMapping("/api/cuser")
@RequiredArgsConstructor
public class CUserController {

    private final CUserService cuserService;

    /** 用户列表（分页+筛选，手机号脱敏） */
    @GetMapping("/list")
    @RequirePerm("cuser:view")
    public Result<PageResult<Map<String, Object>>> list(
            @RequestParam(defaultValue = "1") long index,
            @RequestParam(defaultValue = "10") long size,
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) String phone,
            @RequestParam(required = false) String nickname,
            @RequestParam(required = false) String registerBegin,
            @RequestParam(required = false) String registerEnd,
            @RequestParam(required = false) Integer status) {
        return Result.ok(cuserService.page(index, size, userId, phone, nickname,
                registerBegin, registerEnd, status));
    }

    /** 用户详情 */
    @GetMapping("/{id}")
    @RequirePerm("cuser:view")
    public Result<Map<String, Object>> detail(@PathVariable Long id) {
        return Result.ok(cuserService.detail(id));
    }

    /** 冻结/解冻 */
    @PutMapping("/{id}/status")
    @RequirePerm("cuser:status")
    public Result<Void> status(@PathVariable Long id, @RequestBody StatusBody body) {
        cuserService.updateStatus(id, body.getStatus());
        return Result.ok();
    }

    /** 重置手机号 */
    @PutMapping("/{id}/phone")
    @RequirePerm("cuser:phone")
    public Result<Void> phone(@PathVariable Long id, @RequestBody PhoneBody body) {
        cuserService.resetPhone(id, body.getPhone());
        return Result.ok();
    }

    /** 导出 Excel */
    @GetMapping("/export")
    @RequirePerm("cuser:export")
    public void export(
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) String phone,
            @RequestParam(required = false) String nickname,
            @RequestParam(required = false) String registerBegin,
            @RequestParam(required = false) String registerEnd,
            @RequestParam(required = false) Integer status,
            HttpServletResponse response) throws IOException {
        List<CUser> users = cuserService.exportList(userId, phone, nickname,
                registerBegin, registerEnd, status);
        List<ExportRow> rows = users.stream().map(u -> {
            ExportRow r = new ExportRow();
            r.setUserId(u.getId());
            r.setPhone(u.getPhone());
            r.setNickname(u.getNickname());
            r.setWxBound(u.getWxOpenid() != null && !u.getWxOpenid().isBlank() ? "已绑定" : "未绑定");
            r.setQqBound(u.getQqOpenid() != null && !u.getQqOpenid().isBlank() ? "已绑定" : "未绑定");
            r.setStatus(statusText(u.getStatus()));
            r.setRegisterTime(u.getRegisterTime() == null ? "" : u.getRegisterTime().toString());
            r.setLastLoginTime(u.getLastLoginTime() == null ? "" : u.getLastLoginTime().toString());
            r.setLastLoginSource(sourceText(u.getLastLoginSource()));
            return r;
        }).collect(Collectors.toList());

        response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        response.setCharacterEncoding("utf-8");
        String fileName = URLEncoder.encode("用户列表", StandardCharsets.UTF_8).replace("+", "%20");
        response.setHeader("Content-Disposition", "attachment;filename*=utf-8''" + fileName + ".xlsx");
        EasyExcel.write(response.getOutputStream(), ExportRow.class)
                .registerWriteHandler(new LongestMatchColumnWidthStyleStrategy())
                .sheet("用户列表")
                .doWrite(rows);
    }

    /** 注销管理列表 */
    @GetMapping("/cancel/list")
    @RequirePerm("cuser:cancel:view")
    public Result<PageResult<Map<String, Object>>> cancelList(
            @RequestParam(defaultValue = "1") long index,
            @RequestParam(defaultValue = "10") long size,
            @RequestParam(required = false) Integer status) {
        return Result.ok(cuserService.cancelPage(index, size, status));
    }

    private String statusText(Integer s) {
        if (s == null) return "";
        return switch (s) { case 1 -> "正常"; case 2 -> "冻结"; case 3 -> "注销"; default -> String.valueOf(s); };
    }

    private String sourceText(Integer s) {
        if (s == null) return "";
        return switch (s) { case 1 -> "手机号登录"; case 2 -> "微信"; case 3 -> "QQ"; default -> String.valueOf(s); };
    }

    @Data
    public static class StatusBody { private Integer status; }

    @Data
    public static class PhoneBody { private String phone; }

    @Data
    public static class ExportRow {
        @com.alibaba.excel.annotation.ExcelProperty("用户ID")
        private Long userId;
        @com.alibaba.excel.annotation.ExcelProperty("手机号")
        private String phone;
        @com.alibaba.excel.annotation.ExcelProperty("昵称")
        private String nickname;
        @com.alibaba.excel.annotation.ExcelProperty("微信绑定")
        private String wxBound;
        @com.alibaba.excel.annotation.ExcelProperty("QQ绑定")
        private String qqBound;
        @com.alibaba.excel.annotation.ExcelProperty("状态")
        private String status;
        @com.alibaba.excel.annotation.ExcelProperty("注册时间")
        private String registerTime;
        @com.alibaba.excel.annotation.ExcelProperty("最后登录时间")
        private String lastLoginTime;
        @com.alibaba.excel.annotation.ExcelProperty("登录来源")
        private String lastLoginSource;
    }
}

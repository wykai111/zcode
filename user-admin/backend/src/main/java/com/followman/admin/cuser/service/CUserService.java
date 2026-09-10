package com.followman.admin.cuser.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.followman.admin.common.BizException;
import com.followman.admin.common.OperateLogService;
import com.followman.admin.common.PageResult;
import com.followman.admin.common.SysOperateLog;
import com.followman.admin.common.mapper.SysOperateLogMapper;
import com.followman.admin.cuser.entity.CUser;
import com.followman.admin.cuser.entity.CUserCancel;
import com.followman.admin.cuser.entity.CUserLoginLog;
import com.followman.admin.cuser.mapper.CUserCancelMapper;
import com.followman.admin.cuser.mapper.CUserLoginLogMapper;
import com.followman.admin.cuser.mapper.CUserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/** C 端业务用户管理 */
@Service
@RequiredArgsConstructor
public class CUserService {

    private final CUserMapper userMapper;
    private final CUserLoginLogMapper loginLogMapper;
    private final CUserCancelMapper cancelMapper;
    private final SysOperateLogMapper operateLogMapper;
    private final OperateLogService operateLogService;

    /** 列表：手机号脱敏 */
    public PageResult<Map<String, Object>> page(long index, long size, Long userId, String phone,
                                                String nickname, String registerBegin, String registerEnd,
                                                Integer status) {
        LambdaQueryWrapper<CUser> qw = new LambdaQueryWrapper<CUser>()
                .eq(userId != null, CUser::getId, userId)
                .like(phone != null && !phone.isBlank(), CUser::getPhone, phone)
                .like(nickname != null && !nickname.isBlank(), CUser::getNickname, nickname)
                .ge(registerBegin != null && !registerBegin.isBlank(), CUser::getRegisterTime, registerBegin)
                .le(registerEnd != null && !registerEnd.isBlank(), CUser::getRegisterTime, registerEnd)
                .eq(status != null, CUser::getStatus, status)
                .orderByDesc(CUser::getId);
        Page<CUser> p = userMapper.selectPage(new Page<>(index, size), qw);

        List<Map<String, Object>> list = p.getRecords().stream()
                .map(this::toListMap).collect(Collectors.toList());
        return new PageResult<>(p.getTotal(), p.getSize(), p.getCurrent(), list);
    }

    /** 详情：完整手机号 + 登录历史 + 后台操作记录 */
    public Map<String, Object> detail(Long id) {
        CUser user = userMapper.selectById(id);
        if (user == null) {
            throw new BizException("用户不存在");
        }
        Map<String, Object> result = new HashMap<>(toListMap(user));
        result.put("phone", user.getPhone()); // 详情展示完整手机号

        List<CUserLoginLog> logs = loginLogMapper.selectList(
                new LambdaQueryWrapper<CUserLoginLog>()
                        .eq(CUserLoginLog::getUserId, id)
                        .orderByDesc(CUserLoginLog::getId)
                        .last("LIMIT 50"));
        result.put("loginLogs", logs);

        List<SysOperateLog> opLogs = operateLogMapper.selectList(
                new LambdaQueryWrapper<SysOperateLog>()
                        .eq(SysOperateLog::getModule, "用户")
                        .like(SysOperateLog::getContent, "用户ID:" + id)
                        .orderByDesc(SysOperateLog::getId)
                        .last("LIMIT 50"));
        result.put("operateLogs", opLogs);

        result.put("cancelRecords", cancelMapper.selectList(
                new LambdaQueryWrapper<CUserCancel>()
                        .eq(CUserCancel::getUserId, id)
                        .orderByDesc(CUserCancel::getId)));
        return result;
    }

    /** 冻结/解冻 */
    public void updateStatus(Long id, Integer status) {
        if (status == null || (status != 1 && status != 2)) {
            throw new BizException("状态只能为 1=正常 或 2=冻结");
        }
        CUser user = userMapper.selectById(id);
        if (user == null) {
            throw new BizException("用户不存在");
        }
        if (user.getStatus() != null && user.getStatus() == 3) {
            throw new BizException("用户已注销，不能操作");
        }
        String action = status == 2 ? "冻结" : "解冻";
        user.setStatus(status);
        userMapper.updateById(user);
        operateLogService.save("用户", action,
                action + "用户，用户ID:" + id + "，昵称:" + user.getNickname(),
                "status=" + (status == 2 ? 1 : 2), "status=" + status);
    }

    /** 重置手机号（留痕） */
    public void resetPhone(Long id, String phone) {
        CUser user = userMapper.selectById(id);
        if (user == null) {
            throw new BizException("用户不存在");
        }
        if (phone == null || !phone.matches("^1[3-9]\\d{9}$")) {
            throw new BizException("手机号格式不正确");
        }
        Long cnt = userMapper.selectCount(new LambdaQueryWrapper<CUser>()
                .eq(CUser::getPhone, phone).ne(CUser::getId, id));
        if (cnt > 0) {
            throw new BizException("该手机号已被其他用户绑定");
        }
        String before = user.getPhone();
        user.setPhone(phone);
        userMapper.updateById(user);
        operateLogService.save("用户", "重置手机号",
                "重置手机号，用户ID:" + id + "，昵称:" + user.getNickname(),
                "phone=" + before, "phone=" + phone);
    }

    /** 注销申请列表 */
    public PageResult<Map<String, Object>> cancelPage(long index, long size, Integer status) {
        Page<CUserCancel> p = cancelMapper.selectPage(new Page<>(index, size),
                new LambdaQueryWrapper<CUserCancel>()
                        .eq(status != null, CUserCancel::getStatus, status)
                        .orderByDesc(CUserCancel::getId));
        List<Map<String, Object>> list = p.getRecords().stream().map(c -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", c.getId());
            m.put("userId", c.getUserId());
            m.put("applyTime", c.getApplyTime());
            m.put("coolingEndTime", c.getCoolingEndTime());
            m.put("status", c.getStatus());
            m.put("cancelTime", c.getCancelTime());
            CUser user = userMapper.selectById(c.getUserId());
            if (user != null) {
                m.put("nickname", user.getNickname());
                m.put("phone", maskPhone(user.getPhone()));
            }
            return m;
        }).collect(Collectors.toList());
        return new PageResult<>(p.getTotal(), p.getSize(), p.getCurrent(), list);
    }

    /** 查询导出用的完整列表（不过分页限制） */
    public List<CUser> exportList(Long userId, String phone, String nickname,
                                  String registerBegin, String registerEnd, Integer status) {
        LambdaQueryWrapper<CUser> qw = new LambdaQueryWrapper<CUser>()
                .eq(userId != null, CUser::getId, userId)
                .like(phone != null && !phone.isBlank(), CUser::getPhone, phone)
                .like(nickname != null && !nickname.isBlank(), CUser::getNickname, nickname)
                .ge(registerBegin != null && !registerBegin.isBlank(), CUser::getRegisterTime, registerBegin)
                .le(registerEnd != null && !registerEnd.isBlank(), CUser::getRegisterTime, registerEnd)
                .eq(status != null, CUser::getStatus, status)
                .orderByDesc(CUser::getId);
        return userMapper.selectList(qw);
    }

    private Map<String, Object> toListMap(CUser u) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", u.getId());
        m.put("phone", maskPhone(u.getPhone()));
        m.put("wxBound", u.getWxOpenid() != null && !u.getWxOpenid().isBlank());
        m.put("qqBound", u.getQqOpenid() != null && !u.getQqOpenid().isBlank());
        m.put("nickname", u.getNickname());
        m.put("avatar", u.getAvatar());
        m.put("status", u.getStatus());
        m.put("registerTime", u.getRegisterTime());
        m.put("lastLoginTime", u.getLastLoginTime());
        m.put("lastLoginSource", u.getLastLoginSource());
        return m;
    }

    /** 手机号脱敏：138****5678 */
    public static String maskPhone(String phone) {
        if (phone == null || phone.length() < 7) {
            return phone;
        }
        return phone.substring(0, 3) + "****" + phone.substring(phone.length() - 4);
    }
}

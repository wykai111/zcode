package com.followman.admin.common;

import jakarta.servlet.http.HttpServletRequest;

/** 客户端 IP 工具 */
public class IpUtil {

    public static String get(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip != null && !ip.isBlank() && !"unknown".equalsIgnoreCase(ip)) {
            int idx = ip.indexOf(',');
            return (idx > 0 ? ip.substring(0, idx) : ip).trim();
        }
        ip = request.getHeader("X-Real-IP");
        if (ip != null && !ip.isBlank() && !"unknown".equalsIgnoreCase(ip)) {
            return ip.trim();
        }
        return request.getRemoteAddr();
    }
}

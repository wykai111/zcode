package com.followman.admin.auth;

import lombok.Getter;

/** 当前登录管理员上下文（由 AuthInterceptor 填充，线程隔离） */
public class AdminContext {

    private static final ThreadLocal<Current> HOLDER = new ThreadLocal<>();

    public static void set(Current current) {
        HOLDER.set(current);
    }

    public static Current get() {
        return HOLDER.get();
    }

    public static void clear() {
        HOLDER.remove();
    }

    @Getter
    public static class Current {
        private final Long id;
        private final String username;
        private final String realName;
        private final Long roleId;
        private final boolean superAdmin;
        private final java.util.Set<String> perms;

        public Current(Long id, String username, String realName, Long roleId, boolean superAdmin, java.util.Set<String> perms) {
            this.id = id;
            this.username = username;
            this.realName = realName;
            this.roleId = roleId;
            this.superAdmin = superAdmin;
            this.perms = perms == null ? java.util.Collections.emptySet() : perms;
        }

        public boolean hasPerm(String perm) {
            return superAdmin || perms.contains(perm);
        }
    }
}

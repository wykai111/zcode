package com.followman.admin.admin.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.followman.admin.admin.entity.SysMenu;
import com.followman.admin.admin.entity.SysRole;
import com.followman.admin.admin.mapper.SysMenuMapper;
import com.followman.admin.admin.mapper.SysRoleMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

/** 菜单与角色权限 */
@Service
@RequiredArgsConstructor
public class MenuService {

    private final SysMenuMapper menuMapper;
    private final SysRoleMapper roleMapper;

    /** 角色的权限标识集合 = 菜单 perm + 角色自身 perms */
    public Set<String> permsOfRole(Long roleId) {
        if (roleId == null) {
            return Collections.emptySet();
        }
        SysRole role = roleMapper.selectById(roleId);
        if (role == null) {
            return Collections.emptySet();
        }
        Set<String> perms = new HashSet<>();
        // 菜单级权限（查看权限）
        if (role.getMenuIds() != null && !role.getMenuIds().isBlank()) {
            List<Long> ids = Arrays.stream(role.getMenuIds().split(","))
                    .map(String::trim).filter(s -> !s.isEmpty())
                    .map(Long::valueOf).collect(Collectors.toList());
            if (!ids.isEmpty()) {
                menuMapper.selectBatchIds(ids).stream()
                        .map(SysMenu::getPerm)
                        .filter(Objects::nonNull)
                        .forEach(perms::add);
            }
        }
        // 操作级权限（写权限）
        if (role.getPerms() != null && !role.getPerms().isBlank()) {
            Arrays.stream(role.getPerms().split(","))
                    .map(String::trim).filter(s -> !s.isEmpty())
                    .forEach(perms::add);
        }
        return perms;
    }

    /** 全部启用菜单，按 sort 排序 */
    public List<SysMenu> allMenus() {
        return menuMapper.selectList(new LambdaQueryWrapper<SysMenu>()
                .eq(SysMenu::getStatus, 1)
                .orderByAsc(SysMenu::getSort));
    }

    /** 菜单树（含目录层级） */
    public List<Map<String, Object>> menuTree(Set<Long> allowedIds) {
        List<SysMenu> all = allMenus();
        List<Map<String, Object>> nodes = new ArrayList<>();
        Map<Long, Map<String, Object>> index = new HashMap<>();

        for (SysMenu m : all) {
            if (allowedIds != null && !allowedIds.contains(m.getId())) {
                continue;
            }
            Map<String, Object> node = new LinkedHashMap<>();
            node.put("id", m.getId());
            node.put("parentId", m.getParentId());
            node.put("name", m.getName());
            node.put("path", m.getPath());
            node.put("component", m.getComponent());
            node.put("icon", m.getIcon());
            node.put("type", m.getType());
            node.put("children", new ArrayList<>());
            nodes.add(node);
            index.put(m.getId(), node);
        }
        List<Map<String, Object>> tree = new ArrayList<>();
        for (Map<String, Object> node : nodes) {
            Long parentId = (Long) node.get("parentId");
            Map<String, Object> parent = index.get(parentId);
            if (parent != null) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> children = (List<Map<String, Object>>) parent.get("children");
                children.add(node);
            } else {
                tree.add(node);
            }
        }
        return tree;
    }

    /** 角色列表（下拉选择用） */
    public List<SysRole> roles() {
        return roleMapper.selectList(new LambdaQueryWrapper<SysRole>().orderByAsc(SysRole::getId));
    }
}

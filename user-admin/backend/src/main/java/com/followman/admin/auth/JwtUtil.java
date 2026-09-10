package com.followman.admin.auth;

import com.followman.admin.config.AppProperties;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

/** JWT 工具：生成 / 解析 token */
@Component
public class JwtUtil {

    private final SecretKey key;
    private final AppProperties props;

    public JwtUtil(AppProperties props) {
        this.props = props;
        this.key = Keys.hmacShaKeyFor(props.getJwt().getSecret().getBytes(StandardCharsets.UTF_8));
    }

    /** 生成 token */
    public String generate(Long adminId, String username) {
        long expireMs = props.getJwt().getExpireMinutes() * 60_000L;
        return Jwts.builder()
                .subject(String.valueOf(adminId))
                .claim("username", username)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expireMs))
                .signWith(key)
                .compact();
    }

    /** 解析 token，返回 adminId；无效/过期抛 BizException(401) */
    public Long parse(String token) {
        try {
            Claims claims = Jwts.parser().verifyWith(key).build()
                    .parseSignedClaims(token).getPayload();
            return Long.valueOf(claims.getSubject());
        } catch (JwtException | IllegalArgumentException e) {
            throw new com.followman.admin.common.BizException(401, "登录已失效，请重新登录");
        }
    }

    /** 剩余有效期（毫秒） */
    public long remainingMs(String token) {
        try {
            Claims claims = Jwts.parser().verifyWith(key).build()
                    .parseSignedClaims(token).getPayload();
            return claims.getExpiration().getTime() - System.currentTimeMillis();
        } catch (Exception e) {
            return 0;
        }
    }
}

package com.followman.admin.captcha;

import com.followman.admin.common.BizException;
import com.followman.admin.config.AppProperties;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Base64;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/** 图形验证码：Java2D 生成 4 位字符验证码，内存缓存（生产可替换为 Redis） */
@Service
@RequiredArgsConstructor
public class CaptchaService {

    private final AppProperties props;

    private static final String CHARS = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
    private final Map<String, CaptchaEntry> store = new ConcurrentHashMap<>();

    @Data
    public static class CaptchaEntry {
        private String code;
        private long expireAt;
    }

    /** 生成验证码，返回 {captchaId, base64图片} */
    public Map<String, String> generate() {
        String code = randomCode(4);
        String id = UUID.randomUUID().toString().replace("-", "");
        long expire = System.currentTimeMillis() + props.getAuth().getCaptchaExpireSeconds() * 1000L;
        store.put(id, new CaptchaEntry() {{ setCode(code); setExpireAt(expire); }});
        // 清理过期项
        store.entrySet().removeIf(e -> e.getValue().getExpireAt() < System.currentTimeMillis());

        return Map.of("captchaId", id, "image", "data:image/png;base64," + toBase64(code));
    }

    /** 校验验证码（校验后立即失效） */
    public void verify(String captchaId, String code) {
        if (props.getAuth().isCaptchaDevMode()) {
            return;
        }
        if (captchaId == null || code == null) {
            throw new BizException("验证码错误");
        }
        CaptchaEntry entry = store.remove(captchaId);
        if (entry == null || entry.getExpireAt() < System.currentTimeMillis()) {
            throw new BizException("验证码已过期，请刷新重试");
        }
        if (!entry.getCode().equalsIgnoreCase(code.trim())) {
            throw new BizException("验证码错误");
        }
    }

    private String randomCode(int len) {
        StringBuilder sb = new StringBuilder();
        java.security.SecureRandom rnd = new java.security.SecureRandom();
        for (int i = 0; i < len; i++) {
            sb.append(CHARS.charAt(rnd.nextInt(CHARS.length())));
        }
        return sb.toString();
    }

    private String toBase64(String code) {
        int w = 140, h = 44;
        BufferedImage img = new BufferedImage(w, h, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = img.createGraphics();
        g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        g.setColor(new Color(245, 247, 250));
        g.fillRect(0, 0, w, h);
        java.util.Random rnd = new java.util.Random();
        // 干扰线
        for (int i = 0; i < 5; i++) {
            g.setColor(new Color(150 + rnd.nextInt(80), 150 + rnd.nextInt(80), 150 + rnd.nextInt(80)));
            g.drawLine(rnd.nextInt(w), rnd.nextInt(h), rnd.nextInt(w), rnd.nextInt(h));
        }
        g.setFont(new Font("Arial", Font.BOLD, 28));
        for (int i = 0; i < code.length(); i++) {
            g.setColor(new Color(30 + rnd.nextInt(120), 30 + rnd.nextInt(120), 30 + rnd.nextInt(120)));
            // 保存本次角度，回退时必须用同一个角度（否则坐标系漂移导致字符被裁切）
            double angle = Math.toRadians(rnd.nextInt(24) - 12);
            int cx = 22 + i * 30;
            int cy = 30;
            g.rotate(angle, cx, cy);
            g.drawString(String.valueOf(code.charAt(i)), cx - 10, cy + 9);
            g.rotate(-angle, cx, cy);
        }
        g.dispose();
        try (ByteArrayOutputStream bos = new ByteArrayOutputStream()) {
            ImageIO.write(img, "png", bos);
            return Base64.getEncoder().encodeToString(bos.toByteArray());
        } catch (IOException e) {
            throw new BizException("验证码生成失败");
        }
    }
}

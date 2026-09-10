package com.followman.admin.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

/** 应用配置项（application.yml 中 app.* 前缀） */
@Data
@ConfigurationProperties(prefix = "app")
public class AppProperties {

    private Jwt jwt = new Jwt();
    private Auth auth = new Auth();
    private Cuser cuser = new Cuser();
    private Market market = new Market();

    @Data
    public static class Jwt {
        private String secret;
        private int expireMinutes = 30;
        private int renewThresholdMinutes = 10;
    }

    @Data
    public static class Auth {
        private int maxFailCount = 5;
        private int lockMinutes = 15;
        private int captchaExpireSeconds = 60;
        private boolean captchaDevMode = false;
    }

    @Data
    public static class Cuser {
        private int cancelCoolingDays = 7;
    }

    @Data
    public static class Market {
        private String baseUrl = "https://stock.followman.vip";
    }
}

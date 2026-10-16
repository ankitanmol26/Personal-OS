package com.personalos.backend.configuration;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * Single source of truth for frontend origins permitted across CORS and WebSocket endpoints.
 *
 * In production ('prod' profile), only the explicitly configured origins in
 * 'personalos.frontend.url' are permitted. Localhost development origins are omitted.
 * In development, localhost origins (ports 5173 and 5174) are permitted automatically.
 */
@Component
public class AllowedOriginsProvider {

    private static final Logger log = LoggerFactory.getLogger(AllowedOriginsProvider.class);

    private final String frontendUrl;
    private final boolean isProdProfile;
    private final boolean allowDevLocalhost;

    public AllowedOriginsProvider(
            Environment environment,
            @Value("${personalos.frontend.url:}") String frontendUrl,
            @Value("${personalos.cors.allow-localhost:true}") boolean allowDevLocalhost) {
        this.frontendUrl = frontendUrl;
        this.isProdProfile = environment != null && environment.acceptsProfiles(Profiles.of("prod"));
        this.allowDevLocalhost = allowDevLocalhost;
    }

    public List<String> getAllowedOrigins() {
        List<String> origins = new ArrayList<>();

        if (frontendUrl != null && !frontendUrl.isBlank()) {
            for (String origin : frontendUrl.split(",")) {
                String trimmed = origin.trim();
                while (trimmed.endsWith("/")) {
                    trimmed = trimmed.substring(0, trimmed.length() - 1);
                }
                if (!trimmed.isEmpty()) {
                    if (isValidOrigin(trimmed)) {
                        if (!origins.contains(trimmed)) {
                            origins.add(trimmed);
                        }
                    } else {
                        log.warn("Rejected invalid or malformed frontend origin: '{}'", trimmed);
                    }
                }
            }
        }

        // Only add localhost in development (non-production) profiles
        if (!isProdProfile && allowDevLocalhost) {
            if (!origins.contains("http://localhost:5173")) {
                origins.add("http://localhost:5173");
            }
            if (!origins.contains("http://localhost:5174")) {
                origins.add("http://localhost:5174");
            }
        }

        return Collections.unmodifiableList(origins);
    }

    public boolean isProdProfile() {
        return isProdProfile;
    }

    /**
     * Strictly validates that an origin conforms to RFC 6454 / web origin standards:
     * - Scheme must be http or https
     * - Must contain a valid host
     * - No userinfo (credentials)
     * - No path component beyond an optional trailing slash (which was trimmed)
     * - No query parameters
     * - No URL fragments
     * - Valid URI syntax
     */
    public boolean isValidOrigin(String origin) {
        if (origin == null || origin.isBlank()) {
            return false;
        }
        try {
            URI uri = new URI(origin);
            String scheme = uri.getScheme();
            if (scheme == null || (!scheme.equalsIgnoreCase("http") && !scheme.equalsIgnoreCase("https"))) {
                return false;
            }
            String host = uri.getHost();
            if (host == null || host.isBlank()) {
                return false;
            }
            if (uri.getUserInfo() != null) {
                return false;
            }
            String path = uri.getPath();
            if (path != null && !path.isEmpty() && !path.equals("/")) {
                return false;
            }
            if (uri.getQuery() != null || origin.contains("?")) {
                return false;
            }
            if (uri.getFragment() != null || origin.contains("#")) {
                return false;
            }
            if (origin.endsWith(":")) {
                return false;
            }
            return true;
        } catch (URISyntaxException e) {
            return false;
        }
    }
}

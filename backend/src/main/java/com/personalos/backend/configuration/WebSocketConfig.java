package com.personalos.backend.configuration;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import java.util.List;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final AllowedOriginsProvider allowedOriginsProvider;

    public WebSocketConfig(AllowedOriginsProvider allowedOriginsProvider) {
        this.allowedOriginsProvider = allowedOriginsProvider;
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic");
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        List<String> origins = allowedOriginsProvider.getAllowedOrigins();
        String[] allowed = origins.toArray(new String[0]);

        registry.addEndpoint("/ws")
                .setAllowedOrigins(allowed)
                .withSockJS();
        registry.addEndpoint("/ws")
                .setAllowedOrigins(allowed);
    }
}

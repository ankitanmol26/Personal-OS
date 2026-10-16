package com.personalos.backend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@Service
public class TripEventPublisher {

    private final SimpMessagingTemplate messagingTemplate;

    @Autowired(required = false)
    public TripEventPublisher(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public void publishTripUpdate(Long tripId, String action) {
        if (messagingTemplate == null) return;
        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("tripId", tripId);
            payload.put("action", action);
            payload.put("timestamp", Instant.now().toString());

            messagingTemplate.convertAndSend("/topic/trips/" + tripId, payload);
        } catch (Exception e) {
            // Log and do not fail database operation
            System.err.println("Could not publish WebSocket trip update: " + e.getMessage());
        }
    }
}

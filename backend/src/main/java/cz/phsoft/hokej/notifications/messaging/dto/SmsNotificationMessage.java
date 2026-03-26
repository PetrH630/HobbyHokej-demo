package cz.phsoft.hokej.notifications.messaging.dto;

import cz.phsoft.hokej.notifications.enums.NotificationType;

import java.time.LocalDateTime;

public record SmsNotificationMessage(
        String messageId,
        NotificationType notificationType,
        Long userId,
        Long playerId,
        Long matchId,
        Long registrationId,
        String recipientPhone,
        String text,
        boolean demoMode,
        LocalDateTime createdAt
) {
}
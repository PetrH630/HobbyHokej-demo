package cz.phsoft.hokej.notifications.messaging.dto;

import cz.phsoft.hokej.notifications.enums.NotificationType;

import java.time.LocalDateTime;

public record EmailNotificationMessage(
        String messageId,
        NotificationType notificationType,
        Long userId,
        Long playerId,
        Long matchId,
        Long registrationId,
        String recipientEmail,
        String subject,
        String body,
        boolean html,
        boolean demoMode,
        String recipientKind,
        LocalDateTime createdAt
) {
}
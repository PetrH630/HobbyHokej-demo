package cz.phsoft.hokej.notifications.services;

import cz.phsoft.hokej.notifications.entities.NotificationDeliveryEntity;
import cz.phsoft.hokej.notifications.enums.NotificationType;

public interface NotificationDeliveryService {

    NotificationDeliveryEntity createPendingEmail(
            String messageId,
            NotificationType type,
            Long userId,
            Long playerId,
            Long matchId,
            Long registrationId,
            String recipient,
            String subject,
            String payloadPreview,
            boolean demoMode
    );

    NotificationDeliveryEntity createPendingSms(
            String messageId,
            NotificationType type,
            Long userId,
            Long playerId,
            Long matchId,
            Long registrationId,
            String recipient,
            String payloadPreview,
            boolean demoMode
    );

    void markAsSent(String messageId);

    void markAsFailed(String messageId, String errorMessage);

    void incrementRetryCount(String messageId);
}
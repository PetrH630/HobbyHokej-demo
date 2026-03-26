package cz.phsoft.hokej.notifications.services;

import cz.phsoft.hokej.notifications.entities.NotificationDeliveryEntity;
import cz.phsoft.hokej.notifications.enums.NotificationChannel;
import cz.phsoft.hokej.notifications.enums.NotificationDeliveryStatus;
import cz.phsoft.hokej.notifications.enums.NotificationType;
import cz.phsoft.hokej.notifications.repositories.NotificationDeliveryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Služba pro evidenci delivery stavu externích notifikací.
 */
@Service
public class NotificationDeliveryServiceImpl implements NotificationDeliveryService {

    private final NotificationDeliveryRepository repository;

    public NotificationDeliveryServiceImpl(NotificationDeliveryRepository repository) {
        this.repository = repository;
    }

    @Override
    @Transactional
    public NotificationDeliveryEntity createPendingEmail(
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
    ) {
        NotificationDeliveryEntity entity = new NotificationDeliveryEntity();
        entity.setMessageId(messageId);
        entity.setChannel(NotificationChannel.EMAIL);
        entity.setNotificationType(type);
        entity.setStatus(NotificationDeliveryStatus.PENDING);
        entity.setUserId(userId);
        entity.setPlayerId(playerId);
        entity.setMatchId(matchId);
        entity.setRegistrationId(registrationId);
        entity.setRecipient(recipient);
        entity.setSubject(subject);
        entity.setPayloadPreview(payloadPreview);
        entity.setDemoMode(demoMode);
        entity.setCreatedAt(LocalDateTime.now());
        entity.setRetryCount(0);
        return repository.save(entity);
    }

    @Override
    @Transactional
    public NotificationDeliveryEntity createPendingSms(
            String messageId,
            NotificationType type,
            Long userId,
            Long playerId,
            Long matchId,
            Long registrationId,
            String recipient,
            String payloadPreview,
            boolean demoMode
    ) {
        NotificationDeliveryEntity entity = new NotificationDeliveryEntity();
        entity.setMessageId(messageId);
        entity.setChannel(NotificationChannel.SMS);
        entity.setNotificationType(type);
        entity.setStatus(NotificationDeliveryStatus.PENDING);
        entity.setUserId(userId);
        entity.setPlayerId(playerId);
        entity.setMatchId(matchId);
        entity.setRegistrationId(registrationId);
        entity.setRecipient(recipient);
        entity.setPayloadPreview(payloadPreview);
        entity.setDemoMode(demoMode);
        entity.setCreatedAt(LocalDateTime.now());
        entity.setRetryCount(0);
        return repository.save(entity);
    }

    @Override
    @Transactional
    public void markAsSent(String messageId) {
        repository.findByMessageId(messageId).ifPresent(entity -> {
            entity.setStatus(NotificationDeliveryStatus.SENT);
            entity.setSentAt(LocalDateTime.now());
            entity.setErrorMessage(null);
        });
    }

    @Override
    @Transactional
    public void markAsFailed(String messageId, String errorMessage) {
        repository.findByMessageId(messageId).ifPresent(entity -> {
            entity.setStatus(NotificationDeliveryStatus.FAILED);
            entity.setErrorMessage(errorMessage);
        });
    }

    @Override
    @Transactional
    public void incrementRetryCount(String messageId) {
        repository.findByMessageId(messageId).ifPresent(entity -> {
            Integer retryCount = entity.getRetryCount() == null ? 0 : entity.getRetryCount();
            entity.setRetryCount(retryCount + 1);
        });
    }
}
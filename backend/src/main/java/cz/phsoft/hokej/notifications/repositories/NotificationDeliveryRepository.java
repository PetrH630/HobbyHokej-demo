package cz.phsoft.hokej.notifications.repositories;

import cz.phsoft.hokej.notifications.entities.NotificationDeliveryEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface NotificationDeliveryRepository extends JpaRepository<NotificationDeliveryEntity, Long> {

    Optional<NotificationDeliveryEntity> findByMessageId(String messageId);
}
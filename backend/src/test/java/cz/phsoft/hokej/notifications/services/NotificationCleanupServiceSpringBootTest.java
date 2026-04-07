package cz.phsoft.hokej.notifications.services;

import cz.phsoft.hokej.notifications.entities.NotificationEntity;
import cz.phsoft.hokej.notifications.enums.NotificationType;
import cz.phsoft.hokej.notifications.repositories.NotificationRepository;
import cz.phsoft.hokej.user.entities.AppUserEntity;
import cz.phsoft.hokej.user.enums.Role;
import cz.phsoft.hokej.user.repositories.AppUserRepository;
import jakarta.servlet.http.HttpSession;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.context.ActiveProfiles;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

@SpringBootTest(
        webEnvironment = SpringBootTest.WebEnvironment.NONE,
        properties = {
                "spring.flyway.enabled=false",
                "app.seed.enabled=false",
                "app.notifications.retention-days=14",
                "app.notifications.min-per-user=2",
                "sms.enabled=false",
                "email.enabled=false",
                "textbee.api-url=http://localhost/fake",
                "textbee.api-key=test-key",
                "spring.mail.from=test@localhost",
                "app.base-url=http://localhost:8080",
                "app.frontend-base-url=http://localhost:5173"
        }
)
@ActiveProfiles("test")
class NotificationCleanupServiceSpringBootTest {

    private static final Instant FIXED_NOW = Instant.parse("2026-03-10T18:00:00Z");

    @Autowired
    private NotificationCleanupService notificationCleanupService;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private AppUserRepository appUserRepository;

    @BeforeEach
    void cleanDatabase() {
        notificationRepository.deleteAll();
        appUserRepository.deleteAll();
    }

    @Test
    void cleanupOldNotifications_shouldDeleteOldNotificationsAboveLimitPerUser() {
        AppUserEntity user = persistUser("petr@test.local");

        persistNotification(user, FIXED_NOW.minusSeconds(20L * 24 * 3600), "old-1");
        persistNotification(user, FIXED_NOW.minusSeconds(19L * 24 * 3600), "old-2");
        persistNotification(user, FIXED_NOW.minusSeconds(18L * 24 * 3600), "old-3");
        persistNotification(user, FIXED_NOW.minusSeconds(17L * 24 * 3600), "old-4");

        notificationCleanupService.cleanupOldNotifications();

        List<NotificationEntity> remaining = notificationRepository.findAllByOrderByCreatedAtDesc();

        assertEquals(2, remaining.size());
        assertEquals("old-4", remaining.get(0).getMessageShort());
        assertEquals("old-3", remaining.get(1).getMessageShort());
    }

    @Test
    void cleanupOldNotifications_shouldKeepOldNotificationsWhenCountIsWithinLimit() {
        AppUserEntity user = persistUser("jana@test.local");

        persistNotification(user, FIXED_NOW.minusSeconds(20L * 24 * 3600), "old-1");
        persistNotification(user, FIXED_NOW.minusSeconds(19L * 24 * 3600), "old-2");

        notificationCleanupService.cleanupOldNotifications();

        List<NotificationEntity> remaining = notificationRepository.findAllByOrderByCreatedAtDesc();

        assertEquals(2, remaining.size());
    }

    @Test
    void cleanupOldNotifications_shouldNotDeleteRecentNotifications() {
        AppUserEntity user = persistUser("karel@test.local");

        persistNotification(user, FIXED_NOW.minusSeconds(20L * 24 * 3600), "old-1");
        persistNotification(user, FIXED_NOW.minusSeconds(19L * 24 * 3600), "old-2");
        persistNotification(user, FIXED_NOW.minusSeconds(18L * 24 * 3600), "old-3");

        persistNotification(user, FIXED_NOW.minusSeconds(2L * 24 * 3600), "new-1");
        persistNotification(user, FIXED_NOW.minusSeconds(1L * 24 * 3600), "new-2");

        notificationCleanupService.cleanupOldNotifications();

        List<NotificationEntity> remaining = notificationRepository.findAllByOrderByCreatedAtDesc();

        assertEquals(4, remaining.size());

        long oldCount = remaining.stream()
                .filter(n -> n.getMessageShort().startsWith("old-"))
                .count();

        long newCount = remaining.stream()
                .filter(n -> n.getMessageShort().startsWith("new-"))
                .count();

        assertEquals(2, oldCount);
        assertEquals(2, newCount);
    }

    @Test
    void cleanupOldNotifications_shouldApplyLimitSeparatelyForEachUser() {
        AppUserEntity user1 = persistUser("user1@test.local");
        AppUserEntity user2 = persistUser("user2@test.local");

        persistNotification(user1, FIXED_NOW.minusSeconds(20L * 24 * 3600), "u1-old-1");
        persistNotification(user1, FIXED_NOW.minusSeconds(19L * 24 * 3600), "u1-old-2");
        persistNotification(user1, FIXED_NOW.minusSeconds(18L * 24 * 3600), "u1-old-3");

        persistNotification(user2, FIXED_NOW.minusSeconds(20L * 24 * 3600), "u2-old-1");
        persistNotification(user2, FIXED_NOW.minusSeconds(19L * 24 * 3600), "u2-old-2");
        persistNotification(user2, FIXED_NOW.minusSeconds(18L * 24 * 3600), "u2-old-3");

        notificationCleanupService.cleanupOldNotifications();

        List<NotificationEntity> remaining = notificationRepository.findAllByOrderByCreatedAtDesc();

        long user1Count = remaining.stream()
                .filter(n -> n.getUser().getId().equals(user1.getId()))
                .count();

        long user2Count = remaining.stream()
                .filter(n -> n.getUser().getId().equals(user2.getId()))
                .count();

        assertEquals(2, user1Count);
        assertEquals(2, user2Count);
    }

    private AppUserEntity persistUser(String email) {
        AppUserEntity user = new AppUserEntity();
        user.setName("Test");
        user.setSurname("User");
        user.setEmail(email);
        user.setPassword("secret");
        user.setRole(Role.ROLE_PLAYER);
        user.setEnabled(true);
        return appUserRepository.save(user);
    }

    private NotificationEntity persistNotification(AppUserEntity user, Instant createdAt, String messageShort) {
        NotificationEntity notification = new NotificationEntity();
        notification.setUser(user);
        notification.setType(NotificationType.MATCH_REMINDER);
        notification.setMessageShort(messageShort);
        notification.setMessageFull(messageShort + " full");
        notification.setCreatedAt(createdAt);
        return notificationRepository.save(notification);
    }

    @TestConfiguration
    static class FixedClockConfig {

        @Bean
        @Primary
        Clock testClock() {
            return Clock.fixed(FIXED_NOW, ZoneId.of("UTC"));
        }

        @Bean
        @Primary
        HttpSession httpSession() {
            return Mockito.mock(HttpSession.class);
        }

        @Bean
        @Primary
        JavaMailSender javaMailSender() {
            return Mockito.mock(JavaMailSender.class);
        }
    }
}
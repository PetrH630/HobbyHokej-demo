package cz.phsoft.hokej.notifications.services;

import cz.phsoft.hokej.match.entities.MatchEntity;
import cz.phsoft.hokej.match.enums.MatchMode;
import cz.phsoft.hokej.match.enums.MatchStatus;
import cz.phsoft.hokej.match.repositories.MatchRepository;
import cz.phsoft.hokej.notifications.enums.NotificationType;
import cz.phsoft.hokej.notifications.sms.SmsService;
import cz.phsoft.hokej.player.entities.PlayerEntity;
import cz.phsoft.hokej.player.enums.PlayerPosition;
import cz.phsoft.hokej.player.enums.PlayerStatus;
import cz.phsoft.hokej.player.enums.PlayerType;
import cz.phsoft.hokej.player.repositories.PlayerRepository;
import cz.phsoft.hokej.registration.entities.MatchRegistrationEntity;
import cz.phsoft.hokej.registration.enums.PlayerMatchStatus;
import cz.phsoft.hokej.registration.repositories.MatchRegistrationRepository;
import cz.phsoft.hokej.season.entities.SeasonEntity;
import cz.phsoft.hokej.season.repositories.SeasonRepository;
import jakarta.servlet.http.HttpSession;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.context.ActiveProfiles;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@SpringBootTest(
        webEnvironment = SpringBootTest.WebEnvironment.NONE,
        properties = {
                "spring.flyway.enabled=false",
                "app.seed.enabled=false",

                "app.notifications.reminder.horizon-hours=48",
                "app.notifications.reminder.hours-before=24",
                "app.notifications.reminder.tolerance-minutes=15",
                "app.notifications.reminder.fixed-delay-ms=60000",

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
class MatchReminderSchedulerSpringBootTest {

    private static final ZoneId ZONE_ID = ZoneId.of("Europe/Prague");
    private static final LocalDateTime FIXED_NOW = LocalDateTime.of(2026, 3, 10, 18, 0);

    @Autowired
    private MatchReminderScheduler matchReminderScheduler;

    @Autowired
    private MatchRepository matchRepository;

    @Autowired
    private MatchRegistrationRepository matchRegistrationRepository;

    @Autowired
    private SeasonRepository seasonRepository;

    @Autowired
    private PlayerRepository playerRepository;

    @MockBean
    private NotificationService notificationService;

    @MockBean
    private SmsService smsService;

    @BeforeEach
    void cleanDatabase() {
        matchRegistrationRepository.deleteAll();
        matchRepository.deleteAll();
        playerRepository.deleteAll();
        seasonRepository.deleteAll();
        reset(notificationService, smsService);
    }

    @Test
    void processMatchReminders_shouldNotifyRegisteredPlayerAndMarkReminderAsSent() {
        MatchRegistrationEntity registration =
                persistRegisteredPlayerForMatch(FIXED_NOW.plusHours(24), MatchStatus.UPDATED, false);

        matchReminderScheduler.processMatchReminders();

        MatchRegistrationEntity reloaded =
                matchRegistrationRepository.findById(registration.getId()).orElseThrow();

        assertTrue(reloaded.isReminderAlreadySent());

        ArgumentCaptor<PlayerEntity> playerCaptor = ArgumentCaptor.forClass(PlayerEntity.class);
        verify(notificationService, times(1))
                .notifyPlayer(playerCaptor.capture(), eq(NotificationType.MATCH_REMINDER), any(MatchEntity.class));
    }

    @Test
    void processMatchReminders_shouldSkipCanceledMatch() {
        MatchRegistrationEntity registration =
                persistRegisteredPlayerForMatch(FIXED_NOW.plusHours(24), MatchStatus.CANCELED, false);

        matchReminderScheduler.processMatchReminders();

        MatchRegistrationEntity reloaded =
                matchRegistrationRepository.findById(registration.getId()).orElseThrow();

        assertFalse(reloaded.isReminderAlreadySent());
        verify(notificationService, never())
                .notifyPlayer(any(PlayerEntity.class), any(NotificationType.class), any(MatchEntity.class));
    }

    @Test
    void processMatchReminders_shouldSkipMatchOutsideReminderWindow() {
        MatchRegistrationEntity registration =
                persistRegisteredPlayerForMatch(FIXED_NOW.plusHours(30), MatchStatus.UPDATED, false);

        matchReminderScheduler.processMatchReminders();

        MatchRegistrationEntity reloaded =
                matchRegistrationRepository.findById(registration.getId()).orElseThrow();

        assertFalse(reloaded.isReminderAlreadySent());
        verify(notificationService, never())
                .notifyPlayer(any(PlayerEntity.class), any(NotificationType.class), any(MatchEntity.class));
    }

    @Test
    void processMatchReminders_shouldSkipRegistrationWithAlreadySentReminder() {
        MatchRegistrationEntity registration =
                persistRegisteredPlayerForMatch(FIXED_NOW.plusHours(24), MatchStatus.UPDATED, true);

        matchReminderScheduler.processMatchReminders();

        MatchRegistrationEntity reloaded =
                matchRegistrationRepository.findById(registration.getId()).orElseThrow();

        assertTrue(reloaded.isReminderAlreadySent());
        verify(notificationService, never())
                .notifyPlayer(any(PlayerEntity.class), any(NotificationType.class), any(MatchEntity.class));
    }

    private MatchRegistrationEntity persistRegisteredPlayerForMatch(
            LocalDateTime matchDateTime,
            MatchStatus matchStatus,
            boolean reminderAlreadySent
    ) {
        SeasonEntity season = new SeasonEntity();
        season.setName("2025/2026");
        season.setStartDate(LocalDate.of(2025, 9, 1));
        season.setEndDate(LocalDate.of(2026, 5, 31));
        season.setActive(true);
        season = seasonRepository.save(season);

        MatchEntity match = new MatchEntity();
        match.setSeason(season);
        match.setDateTime(matchDateTime);
        match.setLocation("Ostrava");
        match.setDescription("Reminder integration test");
        match.setMaxPlayers(20);
        match.setPrice(200);
        match.setMatchMode(MatchMode.FIVE_ON_FIVE_WITH_GOALIE);
        match.setMatchStatus(matchStatus);
        match = matchRepository.save(match);

        PlayerEntity player = new PlayerEntity();
        player.setName("Petr");
        player.setSurname("Hlista");
        player.setType(PlayerType.STANDARD);
        player.setPhoneNumber("+420777123123");
        player.setPrimaryPosition(PlayerPosition.CENTER);
        player.setPlayerStatus(PlayerStatus.APPROVED);
        player = playerRepository.save(player);

        MatchRegistrationEntity registration = new MatchRegistrationEntity();
        registration.setMatch(match);
        registration.setPlayer(player);
        registration.setStatus(PlayerMatchStatus.REGISTERED);
        registration.setCreatedBy("test");
        registration.setReminderAlreadySent(reminderAlreadySent);
        registration.setTimestamp(FIXED_NOW.minusDays(2));

        return matchRegistrationRepository.save(registration);
    }

    @TestConfiguration
    static class FixedClockConfig {

        @Bean
        @Primary
        Clock testClock() {
            return Clock.fixed(FIXED_NOW.atZone(ZONE_ID).toInstant(), ZONE_ID);
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